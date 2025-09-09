"use client";

import axios from "axios";
import React from "react";

const FacebookButton = () => {
  //   const router = useRouter();
  const handleClick = async () => {
    try {
      console.log("Button clicked");
      const result = await axios.get(
        "https://cobra-humorous-sharply.ngrok-free.app/auth/facebook"
      );
      console.log(result);
    } catch (error) {
      console.error(error);
    }
    // router.push(result.data.redirectUrl);
    // window.location.href = result.data;
  };

  return (
    <div className=" flex justify-center">
      <button
        onClick={handleClick}
        className="p-2 px-5 bg-blue-500 rounded-2xl text-xl capitalize cursor-pointer mt-12"
      >
        login with facebook
      </button>
    </div>
  );
};

export default FacebookButton;
