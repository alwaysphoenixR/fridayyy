import React from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { BrainCircuit, Search, Database, FileText, Link as LinkIcon, FileVideo, LogOut, Settings, Plus, Globe, Layers, File } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Logo } from './Logo';

export const Layout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className="bg-[#f9f9f9] font-sans text-on-surface antialiased flex min-h-screen">
      
      {/* Left Sidebar Navigation */}
      <aside className="fixed left-0 top-0 bottom-0 w-64 bg-[#f9f9f9] border-r border-[#ececec] z-40 hidden md:flex flex-col justify-between p-6">
        <div>
          {/* Brand Logo / Kicker */}
          <div className="flex items-center gap-2.5 mb-10 pl-1 cursor-pointer" onClick={() => navigate('/dashboard')}>
             <Logo className="h-8 w-auto" />
          </div>
          
          {/* Navigation Groups */}
          <div className="space-y-6">
            
            {/* Intelligence Core */}
            <div>
              <nav className="flex flex-col gap-1">
                <NavLink 
                  to="/dashboard" 
                  end
                  className={({ isActive }) => 
                    `flex items-center gap-3 px-3 py-2.5 rounded-2xl text-[13.5px] transition-colors ${isActive && location.search === '' ? 'font-semibold bg-[#ebebeb] text-black' : 'font-medium text-[#5a5c5d] hover:bg-[#efefef] hover:text-black'}`
                  }
                >
                  <BrainCircuit className="w-[19px] h-[19px]" />
                  <span>Brain</span>
                </NavLink>
                <NavLink 
                  to="/search" 
                  className={({ isActive }) => 
                    `flex items-center gap-3 px-3 py-2.5 rounded-2xl text-[13.5px] transition-colors ${isActive ? 'font-semibold bg-[#ebebeb] text-black' : 'font-medium text-[#5a5c5d] hover:bg-[#efefef] hover:text-black'}`
                  }
                >
                  <Search className="w-[19px] h-[19px]" />
                  <span>AI Search</span>
                </NavLink>
              </nav>
            </div>
            
            {/* Library */}
            <div>
              <p className="px-3 pb-2 text-[10.5px] font-bold text-[#8c8f90] tracking-wider uppercase">LIBRARY</p>
              <nav className="flex flex-col gap-1">
                <NavLink 
                  to="/dashboard?filter=ALL"
                  className={({ isActive }) => `flex items-center gap-3 px-3 py-2 rounded-2xl text-[13.5px] transition-colors ${location.search === '?filter=ALL' ? 'font-semibold bg-[#ebebeb] text-black' : 'font-medium text-[#5a5c5d] hover:bg-[#efefef] hover:text-black'}`}
                >
                  <Layers className="w-[19px] h-[19px]" />
                  <span>All Content</span>
                </NavLink>
                <NavLink 
                  to="/dashboard?filter=note"
                  className={({ isActive }) => `flex items-center gap-3 px-3 py-2 rounded-2xl text-[13.5px] transition-colors ${location.search === '?filter=note' ? 'font-semibold bg-[#ebebeb] text-black' : 'font-medium text-[#5a5c5d] hover:bg-[#efefef] hover:text-black'}`}
                >
                  <FileText className="w-[19px] h-[19px]" />
                  <span>Notes</span>
                </NavLink>
                <NavLink 
                  to="/dashboard?filter=article"
                  className={({ isActive }) => `flex items-center gap-3 px-3 py-2 rounded-2xl text-[13.5px] transition-colors ${location.search === '?filter=article' ? 'font-semibold bg-[#ebebeb] text-black' : 'font-medium text-[#5a5c5d] hover:bg-[#efefef] hover:text-black'}`}
                >
                  <FileText className="w-[19px] h-[19px]" />
                  <span>Articles</span>
                </NavLink>
                <NavLink 
                  to="/dashboard?filter=tweet"
                  className={({ isActive }) => `flex items-center gap-3 px-3 py-2 rounded-2xl text-[13.5px] transition-colors ${location.search === '?filter=tweet' ? 'font-semibold bg-[#ebebeb] text-black' : 'font-medium text-[#5a5c5d] hover:bg-[#efefef] hover:text-black'}`}
                >
                  <LinkIcon className="w-[19px] h-[19px]" />
                  <span>Tweets</span>
                </NavLink>
                <NavLink 
                  to="/dashboard?filter=video"
                  className={({ isActive }) => `flex items-center gap-3 px-3 py-2 rounded-2xl text-[13.5px] transition-colors ${location.search === '?filter=video' ? 'font-semibold bg-[#ebebeb] text-black' : 'font-medium text-[#5a5c5d] hover:bg-[#efefef] hover:text-black'}`}
                >
                  <FileVideo className="w-[19px] h-[19px]" />
                  <span>Videos</span>
                </NavLink>
                <NavLink 
                  to="/dashboard?filter=document"
                  className={({ isActive }) => `flex items-center gap-3 px-3 py-2 rounded-2xl text-[13.5px] transition-colors ${location.search === '?filter=document' ? 'font-semibold bg-[#ebebeb] text-black' : 'font-medium text-[#5a5c5d] hover:bg-[#efefef] hover:text-black'}`}
                >
                  <File className="w-[19px] h-[19px]" />
                  <span>Documents</span>
                </NavLink>
              </nav>
            </div>
            
          </div>
        </div>

        {/* Bottom Workspace Status & Logout */}
        <div className="pt-4 border-t border-[#f0f0f0] flex flex-col gap-2">
          <div className="flex items-center justify-between px-2 py-1.5 text-[13px]">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#fe5f00]"></span>
              <span className="font-medium text-[#37393a]">Public Brain</span>
            </div>
            <span className="text-xs text-[#8c8f90]">Active</span>
          </div>
          <button 
            onClick={logout}
            className="flex items-center gap-2.5 px-2 py-2 text-[13px] font-medium text-[#5a5c5d] hover:text-black transition-colors text-left w-full"
          >
            <LogOut className="w-[18px] h-[18px]" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Workspace Content Area */}
      <div className="md:pl-64 flex-1 flex flex-col min-h-screen">
        <main className="w-full flex-1 px-8 lg:px-12 py-8 max-w-[1600px] mx-auto flex flex-col gap-7">
          <Outlet />
        </main>
      </div>

    </div>
  );
};
