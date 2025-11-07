import {
  GoogleSignin,
  isErrorWithCode,
  isSuccessResponse
} from '@react-native-google-signin/google-signin';
import { makeRedirectUri, useAuthRequest } from 'expo-auth-session';
import {
  GithubAuthProvider,
  GoogleAuthProvider,
  signInWithCredential,
  signInWithEmailAndPassword,
} from 'firebase/auth';
import { useEffect, useState } from 'react';
import { auth } from '../services/firebase';


const googleProvider = new GoogleAuthProvider();

const discovery = {
  authorizationEndpoint: 'https://github.com/login/oauth/authorize',
  tokenEndpoint: 'https://github.com/login/oauth/access_token',
  revocationEndpoint: `https://github.com/settings/connections/applications/${process.env.EXPO_PUBLIC_GITHUB_CLIENT_ID}`,
};


export const useAuth = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const redirectUri = makeRedirectUri({
    scheme: 'zysktms',
  });

  const [request, response, promptAsync] = useAuthRequest(
    {
      clientId: process.env.EXPO_PUBLIC_GITHUB_CLIENT_ID!,
      scopes: ['read:user', 'user:email'], 
      redirectUri: redirectUri,
      usePKCE: true, 
    },
    discovery
  );

  useEffect(() => {
    if (request) {
      console.log('PKCE enabled:', !!request.codeVerifier);
      console.log('Code challenge:', request.codeChallenge ? 'Present' : 'Missing');
    }
  }, [request]);

  useEffect(() => {
    const exchangeCodeForCredential = async (code: string) => {
      setLoading(true);
      setError(null);
      try {
        const tokenResponse = await fetch(discovery.tokenEndpoint, {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            client_id: process.env.EXPO_PUBLIC_GITHUB_CLIENT_ID,
            client_secret: process.env.EXPO_PUBLIC_GITHUB_CLIENT_SECRET,
            code: code,
            code_verifier: request?.codeVerifier, 
          }),
        });

        const tokenData = await tokenResponse.json();
        console.log('Token response:', tokenData);
        
        const { access_token, error, error_description } = tokenData;

        if (error || !access_token) {
          throw new Error(error_description || 'Failed to fetch GitHub access token.');
        }

        console.log('GitHub Access Token received successfully.');

        const credential = GithubAuthProvider.credential(access_token);
        
        await signInWithCredential(auth, credential);
        console.log('User signed in with Firebase using GitHub credential.');

      } catch (e: any) {
        console.error('Error during GitHub sign-in process:', e);
        setError(e.message || 'An unexpected error occurred during GitHub sign-in.');
      } finally {
        setLoading(false);
      }
    };

    if (response?.type === 'success') {
      const { code } = response.params;
      exchangeCodeForCredential(code);
    } else if (response?.type === 'error') {
      console.error('GitHub Auth Error:', response.error);
      setError(response.error?.message || 'Authentication with GitHub failed.');
    }
  }, [response]);

  const signInWithEmail = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      console.log('User Validated with Email.');
    } catch (e) {
      console.log('Error in signInWithEmail:', e);
      setError(e instanceof Error ? e.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    setLoading(true);
    setError(null);
    try {
      await GoogleSignin.hasPlayServices();
      const response = await GoogleSignin.signIn();

      if (isSuccessResponse(response)) {
        const googleCredential = GoogleAuthProvider.credential(response.data.idToken);
        await signInWithCredential(auth, googleCredential);
        console.log('User authenticated with Firebase via Google successfully');
      }
    } catch (e) {
      if (isErrorWithCode(e)) {
        setError(`Google Sign-in Error: ${e.code}`);
      } else {
        setError(e instanceof Error ? e.message : 'Google sign-in failed');
      }
      console.log('Error during Google sign-in:', e);
    } finally {
      setLoading(false);
    }
  };

  const signInWithGitHub = async () => {
    setError(null);
    try {
      if (request) {
        await promptAsync();
      } else {
        throw new Error('GitHub authentication request is not available.');
      }
    } catch (e: any) {
      console.error(`GitHub Sign-in Error: ${e.message}`);
      setError(e.message || 'Could not initiate GitHub sign-in.');
    }
  };

  return { signInWithEmail, signInWithGoogle, signInWithGitHub, loading, error };
};