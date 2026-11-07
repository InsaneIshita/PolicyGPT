import { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import Navbar from "../components/layouts/Navbar";
import Footer from "../components/layouts/Footer";
import {
  LuCalendar,
  LuLandmark,
  LuGraduationCap,
  LuCheck,
  LuExternalLink,
  LuBookmark,
  LuShare2,
  LuChevronRight,
  LuDownload,
  LuFileText,
} from "react-icons/lu";

import FaqsSection from "../components/policy-details/FaqsSection";
import TimelineSection from "../components/policy-details/TimelineSection";
import ImportantChangesSection from "../components/policy-details/ImportantChangesSection";
import WhoIsAffectedSection from "../components/policy-details/WhoIsAffectedSection";
import KeyBenefitsSection from "../components/policy-details/KeyBenefitsSection";
import OverviewSection from "../components/policy-details/OverviewSection";
import ObjectivesSection from "../components/policy-details/ObjectivesSection";
import AuthBlocker from "../components/auth/AuthBlocker";
import { policyService } from "../services/policyService";

export default function PolicyDetailsPage() {
  const { id } = useParams();
  const [policy, setPolicy] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("Overview");
  const token = localStorage.getItem("token");
  const currentUser = JSON.parse(localStorage.getItem("user") || "null");
  const canUseCitizenFeatures = !currentUser || currentUser.role === "citizen";

  useEffect(() => {
    const fetchPolicyDetails = async () => {
      try {
        const data = await policyService.getById(id);
        setPolicy(data);
      } catch (err) {
        console.error("Failed to load policy details:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchPolicyDetails();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-cream font-body flex flex-col justify-between">
        <div>
          <Navbar activeLabel="Policies" />
          <div className="flex-1 flex items-center justify-center py-32">
            <div className="flex flex-col items-center gap-4">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#EA580C]"></div>
              <p className="text-sm font-semibold text-gray-500">Loading policy details...</p>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!policy) {
    return (
      <div className="min-h-screen bg-cream font-body flex flex-col justify-between">
        <div>
          <Navbar activeLabel="Policies" />
          <div className="flex-1 flex items-center justify-center py-32">
            <p className="text-sm font-semibold text-gray-500">Policy not found.</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const tabs = [
    "Overview",
    "Objectives",
    "Key Benefits",
    "Who Is Affected",
    "Important Changes",
    "Timeline",
    "Faqs",
  ];

  return (
    <div className="min-h-screen bg-cream font-body flex flex-col justify-between">
      <div>
        <Navbar activeLabel="Policies" />

        <div className="relative">
          <div className={!token ? "blur-[6px] pointer-events-none select-none" : ""}>
            {/* Hero Section */}
            <section className="hero-gradient-overlay pb-10 pt-8 border-b border-border-light">
              <div className="mx-auto max-w-[1440px] px-5 lg:px-20">
                <nav className="mb-6 flex items-center gap-2 text-sm text-text-body">
                  <Link to="/" className="hover:text-brand-orange transition-colors">Home</Link>
                  <LuChevronRight className="h-4 w-4" />
                  <Link to="/policies" className="hover:text-brand-orange transition-colors">Policies</Link>
                  <LuChevronRight className="h-4 w-4" />
                  <span className="font-semibold text-slate-heading">{policy.title || policy.name}</span>
                </nav>

                {/* Top row: title/description left, buttons right */}
                <div className="flex flex-col lg:flex-row justify-between items-start gap-8 mb-8">
                  <div className="flex-1 max-w-4xl">
                    <div className="flex flex-wrap items-center gap-3 mb-4">
                      <span className="bg-[#eef2ff] text-brand-blue px-3 py-1 rounded-full text-xs font-semibold">{policy.category || "General"}</span>
                      <span className="bg-badge-green-bg text-badge-green-text px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-brand-green"></span>
                        {policy.status || "Active Policy"}
                      </span>
                      <span className="text-[#e75d5d] bg-[#fdf2f2] px-3 py-1 rounded-full text-xs font-semibold">Central Government</span>
                    </div>

                    <h1 className="font-heading text-4xl lg:text-[42px] font-bold leading-tight text-slate-heading mb-3">
                      {policy.title || policy.name}
                    </h1>
                    <p className="text-text-body font-medium mb-6">
                      {policy.department}, Government of India • Published {policy.published || policy.effectiveDate || policy.date || "2024"}
                    </p>
                  </div>

                  <div className="flex flex-col gap-3 w-full sm:w-auto shrink-0">
                    <a
                      href={policy.pdf || "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-btn-yellow hover:bg-brand-orange transition-colors text-slate-heading hover:text-white font-semibold rounded-xl px-6 py-3 flex items-center justify-center gap-2 shadow-btn text-center"
                    >
                      <LuExternalLink className="h-5 w-5" />
                      View Government Source
                    </a>
                    {canUseCitizenFeatures ? (
                      <div className="flex gap-3">
                        <button className="flex-1 bg-white hover:bg-gray-50 transition-colors border border-border-light rounded-xl px-4 py-2.5 flex items-center justify-center gap-2 font-medium text-slate-heading">
                          <LuBookmark className="h-4 w-4" />
                          Save
                        </button>
                        <button className="flex-1 bg-white hover:bg-gray-50 transition-colors border border-border-light rounded-xl px-4 py-2.5 flex items-center justify-center gap-2 font-medium text-slate-heading">
                          <LuShare2 className="h-4 w-4" />
                          Share
                        </button>
                      </div>
                    ) : (
                      <div className="rounded-xl border border-dashed border-gray-200 bg-white/80 px-4 py-3 text-center text-sm font-medium text-gray-500">
                        Citizen access only
                      </div>
                    )}
                  </div>
                </div>

                {/* Full-width stat cards row */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                  <div className="bg-white rounded-xl p-5 border border-border-light shadow-sm flex flex-col justify-center">
                    <LuCalendar className="text-brand-blue h-6 w-6 mb-2" />
                    <p className="font-bold text-slate-heading">{policy.published || policy.effectiveDate || policy.date || "2024"}</p>
                    <p className="text-xs text-text-body">Published</p>
                  </div>
                  <div className="bg-white rounded-xl p-5 border border-border-light shadow-sm flex flex-col justify-center">
                    <LuLandmark className="text-brand-orange h-6 w-6 mb-2" />
                    <p className="font-bold text-slate-heading">{policy.department}</p>
                    <p className="text-xs text-text-body">Department</p>
                  </div>
                  <div className="bg-white rounded-xl p-5 border border-border-light shadow-sm flex flex-col justify-center">
                    <LuGraduationCap className="text-brand-blue h-6 w-6 mb-2" />
                    <p className="font-bold text-slate-heading">{policy.category || "General"}</p>
                    <p className="text-xs text-text-body">Category</p>
                  </div>
                  <div className="bg-white rounded-xl p-5 border border-border-light shadow-sm flex flex-col justify-center">
                    <div className=" w-fit p-1 rounded-md mb-1.5">
                      <LuCheck className="text-badge-green-text h-4 w-4" strokeWidth={3} />
                    </div>
                    <p className="font-bold text-slate-heading">{policy.status || "Active"}</p>
                    <p className="text-xs text-text-body">Status</p>
                  </div>
                </div>
              </div>
            </section>

            {/* Sticky Tabs Navigation */}
            <div className="bg-white border-b border-border-light sticky top-0 z-10 shadow-sm">
              <div className="mx-auto max-w-[1440px] px-5 lg:px-20">
                <div className="flex overflow-x-auto hide-scrollbar">
                  {tabs.map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`whitespace-nowrap py-4 px-5 font-semibold text-sm transition-colors border-b-2 ${activeTab === tab
                        ? "border-brand-orange text-brand-orange"
                        : "border-transparent text-text-body hover:text-slate-heading hover:border-gray-300"
                        }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Main Content Area */}
            <main className="bg-cream mx-auto max-w-[1440px] px-5 lg:px-20 py-10">
              <div className="flex flex-col lg:flex-row gap-8">
                {/* Left Content Column */}
                <div className="flex-1">
                  {activeTab === "Faqs" && <FaqsSection policy={policy} />}
                  {activeTab === "Timeline" && <TimelineSection policy={policy} />}
                  {activeTab === "Important Changes" && <ImportantChangesSection policy={policy} />}
                  {activeTab === "Who Is Affected" && <WhoIsAffectedSection policy={policy} />}
                  {activeTab === "Key Benefits" && <KeyBenefitsSection policy={policy} />}
                  {activeTab === "Overview" && <OverviewSection policy={policy} />}
                  {activeTab === "Objectives" && <ObjectivesSection policy={policy} />}
                </div>

                {/* Right Sidebar */}
                <aside className="w-full lg:w-[340px] flex flex-col gap-6">
                  {/* Official Resources */}
                  <div className="bg-page-warm rounded-2xl p-6 border border-[#fed7aa]">
                    <h3 className="font-heading font-bold text-lg text-slate-heading mb-2">Official Resources</h3>
                    <p className="text-sm text-text-body mb-6">
                      Access original documents from the {policy.department || "Ministry"}.
                    </p>
                    <a
                      href={policy.pdf || "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full bg-btn-yellow hover:bg-brand-orange transition-colors text-slate-heading hover:text-white font-semibold rounded-xl px-4 py-3 flex items-center justify-center gap-2 shadow-btn text-center"
                    >
                      <LuDownload className="h-5 w-5" />
                      Download Policy PDF
                    </a>
                  </div>

                  {/* Related Policies */}
                  <div className="bg-white rounded-2xl p-6 border border-border-light">
                    <h3 className="font-heading font-bold text-lg text-slate-heading mb-5">Related Policies</h3>
                    <div className="flex flex-col gap-5">
                      {[
                        "National Curriculum Framework 2023",
                        "Digital Education Policy",
                        "National Digital Education Architecture",
                        "Skill India Policy 2015"
                      ].map((policy, idx) => (
                        <div key={idx} className="group cursor-pointer">
                          <h4 className="font-semibold text-sm text-slate-heading group-hover:text-brand-orange transition-colors">{policy}</h4>
                          <div className="flex items-center gap-1.5 mt-1 text-xs text-text-body">
                            <LuFileText className="h-3 w-3" />
                            View Policy
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </aside>
              </div>
            </main>
          </div>

          {!token && <AuthBlocker pageName="Policy Details" />}
        </div>
      </div>

      <Footer />
    </div>
  );
}
