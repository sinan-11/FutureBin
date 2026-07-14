import { FaLeaf } from "react-icons/fa";

import Layout from "../components/Layout";

const Home = () => {
  return (
    <Layout>
      <section className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-brand-700 via-brand-600 to-brand-800 pt-20">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.1)_0%,transparent_60%)]" />
        <div className="pointer-events-none absolute -top-40 -right-40 h-96 w-96 rounded-full bg-brand-400/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-brand-300/10 blur-3xl" />

        <div className="relative z-10 mx-auto max-w-4xl px-6 text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-sm text-white/80 backdrop-blur-sm">
            <FaLeaf className="h-4 w-4 text-brand-200" />
            Smart Waste Management Platform
          </div>

          <h1 className="mb-6 text-4xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl md:text-7xl">
            Waste Collection,{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-200 to-white">
              Reimagined
            </span>
          </h1>

          <p className="mx-auto max-w-2xl text-lg text-white/70 md:text-xl">
            A smarter way to manage waste collection. Real-time tracking, automated scheduling, and a cleaner tomorrow for everyone.
          </p>
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="h-8 w-5 rounded-full border-2 border-white/30" />
        </div>
      </section>
    </Layout>
  );
};

export default Home;
