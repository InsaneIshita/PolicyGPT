import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import Navbar from "../components/layouts/Navbar";
import Footer from "../components/layouts/Footer";
import {
    LuCalendar,
    LuLandmark,
    LuUsers,
    LuCheck,
    LuExternalLink,
    LuBookmark,
    LuShare2,
    LuFileText,
    LuChevronRight,
} from "react-icons/lu";
import schemesData from "../data/schemesData";
import { schemeService } from "../services/schemeService";
import OverviewSection from "../components/scheme-details/OverviewSection";
import EligibilitySection from "../components/scheme-details/EligibilitySection";
import BenefitsSection from "../components/scheme-details/BenefitsSection";
import DocumentsSection from "../components/scheme-details/DocumentsSection";
import ApplySection from "../components/scheme-details/ApplySection";
import FaqsSection from "../components/scheme-details/FaqsSection";

const tabs = ["Overview", "Eligibility", "Benefits", "Documents", "Apply", "Faqs"];

export default function SchemeDetailsPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState("Overview");
    const [apiScheme, setApiScheme] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [isBookmarked, setIsBookmarked] = useState(false);
    const token = localStorage.getItem("token");
    const currentUser = JSON.parse(localStorage.getItem("user") || "null");
    const canUseCitizenFeatures = !currentUser || currentUser.role === "citizen";

    useEffect(() => {
        if (!id) return;
        if (id.length === 24) {
            const loadDetail = async () => {
                setIsLoading(true);
                setError(null);
                try {
                    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api"}/schemes/${id}`, {
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    });
                    const res = await response.json();
                    if (res.success) {
                        const s = res.data;
                        const mapped = {
                            id: s._id || s.id,
                            category: s.category || "General",
                            title: s.title || s.name,
                            description: s.description || "",
                            objective: s.objective || "",
                            ministry: s.department || s.ministry || "Central Ministry",
                            ministryStat: s.department || s.ministry || "Central Ministry",
                            applicants: s.beneficiaries || "N/A",
                            state: (s.eligibility && s.eligibility.states && s.eligibility.states[0]) || "All India",
                            badges: s.badgeTag ? [{ label: s.badgeTag, type: "popular" }] : [
                                { label: s.category || "General", type: "new" },
                                { label: (s.eligibility && s.eligibility.states && s.eligibility.states[0]) || "Central", type: "popular" }
                            ],
                            benefit: s.annualBenefit || s.benefit || "Ongoing",
                            deadline: s.deadline || "Ongoing",
                            eligibility: s.eligibility || ["Open for All"],
                            eligibilityDetails: s.eligibilitySummary || "",
                            benefits: s.benefits || "No benefit details provided.",
                            documentsRequired: s.documentsRequired || s.requiredDocuments || [],
                            apply: s.applicationModeSummary || "Register online using official details.",
                            applicationProcess: s.applicationModeSummary || "Register online using official details.",
                            applicationUrl: s.applicationUrl || s.pdfLink || "#",
                            helpline: s.helpline || "Contact nodal bank / department"
                        };
                        setApiScheme(mapped);
                        
                        // Check if scheme is bookmarked
                        try {
                            const saved = await schemeService.isSaved(id);
                            setIsBookmarked(saved);
                        } catch (err) {
                            console.warn("Failed to check saved status on load:", err.message);
                        }
                    } else {
                        setError(res.message || "Failed to load scheme details.");
                    }
                } catch (err) {
                    console.error("Error loading scheme details:", err);
                    setError("Network error occurred while fetching details.");
                } finally {
                    setIsLoading(false);
                }
            };
            loadDetail();
        } else {
            const numericId = Number(id);
            const found = schemesData.find((item) => item.id === numericId);
            setApiScheme(found || null);
        }
    }, [id, token]);

    const handleToggleBookmark = async () => {
        if (!canUseCitizenFeatures) return;
        const nextState = !isBookmarked;
        setIsBookmarked(nextState);

        if (id && id.toString().length === 24) {
            try {
                if (nextState) {
                    await schemeService.save(id);
                } else {
                    await schemeService.unsave(id);
                }
            } catch (err) {
                console.error("Failed to toggle bookmark:", err.message);
                setIsBookmarked(!nextState); // Revert state
            }
        }
    };

    const scheme = apiScheme;

    if (isLoading) {
        return (
            <div className="min-h-screen bg-cream flex flex-col justify-between">
                <Navbar activeLabel="Explore Schemes" />
                <main className="mx-auto max-w-[1440px] px-5 lg:px-20 py-20 text-center animate-pulse">
                    <p className="font-heading text-2xl font-bold text-slate-heading">Loading scheme details...</p>
                </main>
                <Footer />
            </div>
        );
    }

    if (error || !scheme) {
        return (
            <div className="min-h-screen bg-cream flex flex-col justify-between">
                <Navbar activeLabel="Explore Schemes" />
                <main className="mx-auto max-w-[1440px] px-5 lg:px-20 py-20 text-center">
                    <p className="font-heading text-2xl font-bold text-red-600">Scheme not found</p>
                    <p className="mt-2 text-sm text-text-secondary">{error || "The selected scheme could not be found."}</p>
                    <button
                        onClick={() => navigate("/schemes")}
                        className="mt-6 rounded-xl bg-brand-orange px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-blue"
                    >
                        Back to schemes
                    </button>
                </main>
                <Footer />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-cream font-body">
            <Navbar activeLabel="Explore Schemes" />

            <section className="hero-gradient-overlay pb-10 pt-8 border-b border-border-light">
                <div className="mx-auto max-w-[1440px] px-5 lg:px-20">
                    <nav className="mb-6 flex items-center gap-2 text-sm text-text-body">
                        <Link to="/" className="hover:text-brand-orange transition-colors">Home</Link>
                        <LuChevronRight className="h-4 w-4" />
                        <Link to="/schemes" className="hover:text-brand-orange transition-colors">Explore Schemes</Link>
                        <LuChevronRight className="h-4 w-4" />
                        <span className="font-semibold text-slate-heading">{scheme.title}</span>
                    </nav>

                    <div className="flex flex-col lg:flex-row justify-between items-start gap-8 mb-8">
                        <div className="flex-1 max-w-4xl">
                            <div className="flex flex-wrap items-center gap-3 mb-4">
                                {scheme.badges.map((badge) => (
                                    <span
                                        key={badge.label}
                                        className={`px-3 py-1 rounded-full text-xs font-semibold ${badge.type === "popular"
                                                ? "bg-card-orange/40 text-brand-orange"
                                                : badge.type === "new"
                                                    ? "bg-[#E3F3FF] text-brand-blue-dark"
                                                    : "bg-card-green text-brand-green"
                                            }`}
                                    >
                                        {badge.label}
                                    </span>
                                ))}
                                <span className="bg-badge-green-bg text-badge-green-text px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5">
                                    <span className="h-2 w-2 rounded-full bg-brand-green"></span>
                                    Active Scheme
                                </span>
                                <span className="text-[#e75d5d] bg-[#fdf2f2] px-3 py-1 rounded-full text-xs font-semibold">{scheme.category}</span>
                            </div>

                            <h1 className="font-heading text-4xl lg:text-[42px] font-bold leading-tight text-slate-heading mb-3">
                                {scheme.title}
                            </h1>
                            <p className="text-text-body font-medium mb-6">{scheme.ministry}</p>
                            <p className="text-slate-heading leading-relaxed max-w-2xl">
                                {scheme.description}
                            </p>
                        </div>

                        <div className="flex flex-col gap-3 w-full sm:w-auto shrink-0">
                            {canUseCitizenFeatures && (
                                <button className="bg-btn-yellow hover:bg-brand-orange transition-colors text-slate-heading hover:text-white font-semibold rounded-xl px-6 py-3 flex items-center justify-center gap-2 shadow-btn">
                                    <LuExternalLink className="h-5 w-5" />
                                    Check My Eligibility
                                </button>
                            )}
                            {canUseCitizenFeatures && (
                                <div className="flex gap-3">
                                    <button
                                        onClick={handleToggleBookmark}
                                        className={`flex-1 transition-colors border rounded-xl px-4 py-2.5 flex items-center justify-center gap-2 font-medium ${
                                            isBookmarked
                                                ? "bg-orange-50 border-brand-orange text-brand-orange hover:bg-orange-100"
                                                : "bg-white border-border-light text-slate-heading hover:bg-gray-50"
                                        }`}
                                    >
                                        <LuBookmark className={`h-4 w-4 ${isBookmarked ? "fill-current" : ""}`} />
                                        {isBookmarked ? "Saved" : "Save"}
                                    </button>
                                    <button className="flex-1 bg-white hover:bg-gray-50 transition-colors border border-border-light rounded-xl px-4 py-2.5 flex items-center justify-center gap-2 font-medium text-slate-heading">
                                        <LuShare2 className="h-4 w-4" />
                                        Share
                                    </button>
                                </div>
                            )}
                            {!canUseCitizenFeatures && (
                                <div className="rounded-xl border border-dashed border-gray-200 bg-white/80 px-4 py-3 text-center text-sm font-medium text-gray-500">
                                    Citizen access only
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                        <div className="bg-white rounded-xl p-5 border border-border-light shadow-sm flex flex-col justify-center">
                            <LuCalendar className="text-brand-blue h-6 w-6 mb-2" />
                            <p className="font-bold text-slate-heading">Ongoing</p>
                            <p className="text-xs text-text-body">Status</p>
                        </div>
                        <div className="bg-white rounded-xl p-5 border border-border-light shadow-sm flex flex-col justify-center">
                            <LuLandmark className="text-brand-orange h-6 w-6 mb-2" />
                            <p className="font-bold text-slate-heading">{scheme.ministryStat}</p>
                            <p className="text-xs text-text-body">Ministry</p>
                        </div>
                        <div className="bg-white rounded-xl p-5 border border-border-light shadow-sm flex flex-col justify-center">
                            <LuUsers className="text-brand-blue h-6 w-6 mb-2" />
                            <p className="font-bold text-slate-heading">{scheme.applicants}</p>
                            <p className="text-xs text-text-body">Beneficiaries</p>
                        </div>
                        <div className="bg-white rounded-xl p-5 border border-border-light shadow-sm flex flex-col justify-center">
                            <div className="w-fit p-1 rounded-md mb-1.5">
                                <LuCheck className="text-badge-green-text h-4 w-4" strokeWidth={3} />
                            </div>
                            <p className="font-bold text-slate-heading">Active</p>
                            <p className="text-xs text-text-body">Status</p>
                        </div>
                    </div>
                </div>
            </section>

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

            <main className="bg-cream mx-auto max-w-[1440px] px-5 lg:px-20 py-10">
                <div className="flex flex-col lg:flex-row gap-8">
                    <div className="flex-1">
                        {activeTab === "Overview" && <OverviewSection scheme={scheme} />}
                        {activeTab === "Eligibility" && <EligibilitySection scheme={scheme} />}
                        {activeTab === "Benefits" && <BenefitsSection scheme={scheme} />}
                        {activeTab === "Documents" && <DocumentsSection scheme={scheme} />}
                        {activeTab === "Apply" && <ApplySection scheme={scheme} />}
                        {activeTab === "Faqs" && <FaqsSection scheme={scheme} />}
                    </div>

                    <aside className="w-full lg:w-[340px] flex flex-col gap-6">
                        <div className="bg-page-warm rounded-2xl p-6 border border-[#fed7aa]">
                            <h3 className="font-heading font-bold text-lg text-slate-heading mb-2">Quick Apply</h3>
                            <p className="text-sm text-text-body mb-6">
                                Apply through the official government portal for this scheme.
                            </p>
                            <button className="w-full bg-btn-yellow hover:bg-brand-orange transition-colors text-slate-heading hover:text-white font-semibold rounded-xl px-4 py-3 flex items-center justify-center gap-2 shadow-btn">
                                <LuExternalLink className="h-5 w-5" />
                                Apply on official portal
                            </button>
                        </div>

                        {/* Related Schemes */}
                        <div className="bg-white rounded-2xl p-6 border border-border-light">
                            <h3 className="font-heading font-bold text-lg text-slate-heading mb-5">Related Schemes</h3>
                            <div className="flex flex-col gap-5">
                                {[
                                    "National Curriculum Framework 2023",
                                    "Digital Education Policy",
                                    "National Digital Education Architecture",
                                    "Skill India Policy 2015"
                                ].map((scheme, idx) => (
                                    <div key={idx} className="group cursor-pointer">
                                        <h4 className="font-semibold text-sm text-slate-heading group-hover:text-brand-orange transition-colors">{scheme}</h4>
                                        <div className="flex items-center gap-1.5 mt-1 text-xs text-text-body">
                                            <LuFileText className="h-3 w-3" />
                                            View Scheme
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </aside>
                </div>
            </main>

            <Footer />
        </div>
    );
}
