import React from 'react';
import { Navigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ArrowRight, Search as SearchIcon, Brain, Sparkles, Network } from 'lucide-react';
import { Logo } from '../components/Logo';

export const Landing: React.FC = () => {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-surface font-sans text-on-surface antialiased selection:bg-secondary-container selection:text-on-primary">
      <header className="fixed top-0 w-full z-50 bg-surface/85 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
        <div className="h-20 max-w-[1440px] mx-auto px-6 md:px-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/" className="flex items-center gap-2 group">
              <Logo className="h-10 w-auto" />
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <Link 
              to="/login" 
              className="bg-brand-black text-white font-semibold text-sm px-5 py-2.5 rounded-full shadow-sm hover:bg-neutral-800 transition-all flex items-center gap-2 tracking-tight group"
            >
              <span>Try product</span>
              <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>
      </header>
      
      <main className="w-full pt-20 bg-surface">
        <div className="flex flex-col w-full">
          {/* SECTION 1: MASTER HERO STATEMENT */}
          <section className="w-full relative overflow-hidden bg-surface pt-12 pb-20 md:pt-16 md:pb-28">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[1600px] pointer-events-none opacity-80 mix-blend-multiply select-none z-0">
              {/* Luminous horizon glow arc - Using a CSS radial gradient to simulate the effect if image isn't available, but we can also use the image URL from the design */}
              <img 
                alt="Luminous horizon glow arc" 
                className="w-full h-auto object-contain object-top" 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBCGqk3WWsUJdENWKvITfzphE8ckTQvTnLkQzChIg2qGtUmNPsSTDrRd0lg8k-8j2E8KYQkM98gdcQlhh2x1zLuXSBvhALjTQqz57YQ8E5V2LrkNaW-7cfxcxPcEOwrP4q8h0MEQteQ9ShTJrixYqUCw-i3H4FgW8h7Qlb8X84E9Y0aP9n28czdAnAxk1-i_0Y9MmqVJ-btafr5FNKcLpFMoHk9TD0XbI83oG1JTFlTwyu3n9favC7kvg" 
              />
            </div>
            <div className="max-w-[1440px] mx-auto px-6 md:px-8 relative z-10">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-16 items-start">
                <div className="lg:col-span-7 flex flex-col">
                  <h1 className="text-4xl md:text-[56px] font-bold text-brand-black leading-[1.08] tracking-[-0.03em] max-w-2xl">
                    Unlocking the power of your data through intelligent retrieval.
                  </h1>
                </div>
                <div className="lg:col-span-5 flex flex-col pt-3 lg:pt-2">
                  <p className="text-lg text-brand-gray-500 leading-relaxed mb-6">
                    Personal knowledge bases are no longer just static text files. They are dynamic ecosystems that understand context, synthesize complex information, and recall insights bespoke to the user's thought process.
                  </p>
                  <p className="text-lg text-brand-gray-500 leading-relaxed mb-10">
                    In an information-dense environment, you need your data instantly accessible without hallucination. Friday ensures your knowledge moves at the speed of thought.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* SECTION 2: THE STEP-BY-STEP WORKFLOW BOX */}
          <section className="w-full bg-surface pb-24">
            <div className="max-w-[1440px] mx-auto px-6 md:px-8">
              {/* Luxury Master Enclosure Card */}
              <div className="w-full bg-white rounded-[32px] p-8 sm:p-12 lg:p-16 border border-black/[0.06] shadow-[0_4px_24px_-4px_rgba(20,20,20,0.04)]">
                {/* Header Split Row inside Box */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-16 pb-12 lg:pb-16 border-b border-black/[0.05]">
                  <div className="lg:col-span-7">
                    <h2 className="text-3xl md:text-[40px] font-bold text-brand-black tracking-[-0.025em] leading-[1.15] max-w-xl">
                      Example: An Engineer Seamlessly Querying Their Second Brain
                    </h2>
                  </div>
                  <div className="lg:col-span-5 flex flex-col justify-center space-y-3">
                    <p className="text-[15px] text-brand-gray-500 leading-relaxed">
                      A developer uses Friday to instantly retrieve and synthesize complex concepts from months of saved documentation and research notes.
                    </p>
                    <p className="text-[15px] text-brand-gray-500 leading-relaxed">
                      You simply assign Friday a clear task: interrogate the knowledge base for a specific technical concept or past project detail.
                    </p>
                  </div>
                </div>

                {/* 4-Step Process Flow with Warm Yellow Outlined Circles */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-6 pt-12 lg:pt-16">
                  {/* STEP 1 */}
                  <div className="flex flex-col items-center text-center group">
                    <div className="w-28 h-28 rounded-full border border-amber-400/85 bg-white flex items-center justify-center mb-6 shadow-sm transition-all duration-300 group-hover:scale-105 group-hover:shadow-md relative">
                      <div className="w-20 h-20 rounded-full bg-surface-container-low flex items-center justify-center">
                        <Brain className="w-8 h-8 text-brand-black" />
                      </div>
                      <span className="absolute -top-1 -right-1 w-3 h-3 bg-accent-orange rounded-full ring-2 ring-white"></span>
                    </div>
                    <span className="text-[22px] text-brand-black font-bold mb-3">Step 1</span>
                    <p className="text-[13px] text-brand-gray-500 leading-relaxed px-2">
                      The platform ingests your documents and notes, utilizing advanced embedding models to chunk the text and store it securely within a high-performance Qdrant vector database.
                    </p>
                  </div>

                  {/* STEP 2 */}
                  <div className="flex flex-col items-center text-center group">
                    <div className="w-28 h-28 rounded-full border border-amber-400/85 bg-white flex items-center justify-center mb-6 shadow-sm transition-all duration-300 group-hover:scale-105 group-hover:shadow-md relative">
                      <div className="w-20 h-20 rounded-full bg-surface-container-low flex items-center justify-center">
                        <Sparkles className="w-8 h-8 text-brand-black" />
                      </div>
                    </div>
                    <span className="text-[22px] text-brand-black font-bold mb-3">Step 2</span>
                    <p className="text-[13px] text-brand-gray-500 leading-relaxed px-2">
                      When you issue a query, Friday utilizes Hypothetical Document Embeddings (HyDE) to generate an ideal, theoretical response that captures the true semantic intent of your question.
                    </p>
                  </div>

                  {/* STEP 3 */}
                  <div className="flex flex-col items-center text-center group">
                    <div className="w-28 h-28 rounded-full border border-amber-400/85 bg-white flex items-center justify-center mb-6 shadow-sm transition-all duration-300 group-hover:scale-105 group-hover:shadow-md relative">
                      <div className="w-20 h-20 rounded-full bg-surface-container-low flex items-center justify-center">
                        <Network className="w-8 h-8 text-brand-black" />
                      </div>
                    </div>
                    <span className="text-[22px] text-brand-black font-bold mb-3">Step 3</span>
                    <p className="text-[13px] text-brand-gray-500 leading-relaxed px-2">
                      The system rapidly executes a semantic search, comparing your query's vector against your personalized database to instantly retrieve the most relevant and accurate context.
                    </p>
                  </div>

                  {/* STEP 4 */}
                  <div className="flex flex-col items-center text-center group">
                    <div className="w-28 h-28 rounded-full border border-amber-400/85 bg-white flex items-center justify-center mb-6 shadow-sm transition-all duration-300 group-hover:scale-105 group-hover:shadow-md relative">
                      <div className="w-20 h-20 rounded-full bg-surface-container-low flex items-center justify-center">
                        <SearchIcon className="w-8 h-8 text-brand-black" />
                      </div>
                      <span className="absolute bottom-0 right-1 w-3 h-3 bg-brand-black rounded-full ring-2 ring-white flex items-center justify-center">
                        <span className="w-1.5 h-1.5 bg-white rounded-full"></span>
                      </span>
                    </div>
                    <span className="text-[22px] text-brand-black font-bold mb-3">Step 4</span>
                    <p className="text-[13px] text-brand-gray-500 leading-relaxed px-2">
                      The retrieval pipeline feeds the isolated context into the LLM, synthesizing a precise, grounded answer directly to your interface, saving you from endless scrolling.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>

      <footer className="w-full bg-white shadow-[0_-1px_8px_rgba(0,0,0,0.02)] mt-10">
        <div className="max-w-[1440px] mx-auto px-6 md:px-8 py-8 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-black/[0.04]">
          <div className="flex items-center gap-2">
            <Logo className="h-5 w-auto" />
          </div>
          <div className="flex items-center gap-6 text-xs text-brand-gray-500 font-medium">
            <span>© 2026 Friday Inc.</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
