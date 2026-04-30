import { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../components/ortu/SidebarOrtu";
import AppHeader from "./AppHeader";
import Footer from "../components/ortu/FooterOrtu";

export default function LayoutOrtu() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] =
    useState(false);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsMobileSidebarOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);

    return () =>
      window.removeEventListener(
        "resize",
        handleResize
      );
  }, []);

  return (
    <div className="h-screen flex bg-[#ECEBEB] text-gray-800 overflow-hidden">

      {/* MOBILE OVERLAY */}
      <div
        onClick={() => setIsMobileSidebarOpen(false)}
        className={`lg:hidden fixed inset-0 bg-black/45 backdrop-blur-sm z-40 transition-all duration-300 ${
          isMobileSidebarOpen ? "opacity-100 visible" : "opacity-0 invisible"
        }`}
      />

      {/* DESKTOP SIDEBAR */}
      <div className="hidden lg:block h-full">
        <Sidebar
          isSidebarOpen={isSidebarOpen}
          mobile={false}
        />
      </div>

      {/* MOBILE SIDEBAR */}
      <div
        className={`
          fixed top-0 left-0 z-50 h-full lg:hidden
          transition-transform duration-300 ease-out
          ${
            isMobileSidebarOpen
              ? "translate-x-0"
              : "-translate-x-full"
          }
        `}
      >
        <Sidebar
          isSidebarOpen={true}
          mobile={true}
          closeSidebar={() =>
            setIsMobileSidebarOpen(false)
          }
        />
      </div>

      {/* CONTENT */}
      <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto no-scrollbar p-3 sm:p-4 md:p-6">

          <AppHeader
            isSidebarOpen={isSidebarOpen}
            setIsSidebarOpen={setIsSidebarOpen}
            openMobileSidebar={() =>
              setIsMobileSidebarOpen(true)
            }
          />

          <Outlet />
        </main>

        <Footer />
      </div>
    </div>
  );
}