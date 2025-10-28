import AssessmentResponse from "@/types/exam";
import ApiResponse from "../types/home";
import axiosInstance from "./axiosInstance";


export const fetchData = async (limit: number, skip: number): Promise<ApiResponse> =>{
  try{
    const response = await axiosInstance.get(`/posts?limit=${limit}&skip=${skip}&select=title,body,reactions,tags,userId,views`);
    return response.data;
  }catch(error){
    throw error;
  }
}


export const fetchPostById = async (id: number) => {
  try {
    const response = await axiosInstance.get(`/posts/${id}`);
    return response.data; 
  } catch (error) {
    throw error;
  }
};



export const fetchAssessmentQuestions = async (): Promise<AssessmentResponse> => {
  try {
    const response = await axiosInstance.get("https://cee04ca2b3a8460abe019b337627d7cb.api.mockbin.io/");
    return response.data;
  } catch (error) {
    throw error;
  }
};