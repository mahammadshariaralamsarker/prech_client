"use client";

import axios from "axios";
import React from "react";

const FacebookButton = () => {
  //   const router = useRouter();
  const handleClick = async () => {
    const result = await axios.get("http://localhost:3000/auth/facebook");
    console.log(result);
    // router.push(result.data.redirectUrl);
    window.location.href = result.data;
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
