import { Redirect } from 'expo-router';
import "./global.css";

const AuthIndex = () => {
  return <Redirect href="/(auth)/splash" />;
};

export default AuthIndex;
