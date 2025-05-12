import axios, { AxiosError } from "axios";
import type { Auth0Management } from "../apis/auth0/Auth0Management";

// Helper function to handle errors consistently
export function handleError(error: any): void {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<Auth0Management.ErrorResponse>;
    if (axiosError.response) {
      // Server responded with a non-2xx status code
      console.log("Server error:", axiosError.response.data);
    } else {
      // No response received
      console.log("Axios error, no response:", error.message);
    }
  } else {
    // Non-Axios error
    console.log("Unexpected error:", error);
  }
}
