import React from "react";
import Image from "next/image";
import logo from "../../../public/logo.png";
import { Search } from "lucide-react";

const header: React.FC = () => {
  return (
    <>
      <div className="border-b-1 border-stone-200 border-opacity-25 w-full px-16 py-3">
        <div className="flex gap-3 items-center">
          <Image src={logo} alt="Student Senior Blog" height={50}></Image>
          <div className="bg-stone-100 rounded-full px-3 py-0.5 flex items-center">
            <Search className="h-10" />
            <input
              type="text"
              className="h-full outline-none text-lg px-2"
              placeholder="Search"
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default header;
