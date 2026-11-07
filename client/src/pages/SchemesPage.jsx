import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/layouts/Navbar";
import Footer from "../components/layouts/Footer";
import SchemeCard from "../components/ui/SchemeCard";
import PolicyFilter from "../components/policies/PolicyFilter";
import SchemeSearch from "../components/schemes/SchemeSearch";
import {
  filterCategories,
  filterEligibility,
  sortOptions,
  stateOptions,
} from "../data/schemesData";
import { schemeService } from "../services/schemeService";
import breadcrumbChevron from "../assets/icons/policies/breadcrumb-chevron.svg";
import sortDropdownArrow from "../assets/icons/policies/sort-dropdown-arrow.svg";
import AuthBlocker from "../components/auth/AuthBlocker";

const ITEMS_PER_PAGE = 6;

function Pagination({ currentPage, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;

  const pages = [];
  const maxVisiblePages = 5;
  let startPage = Math.max(1, currentPage - 2);
  let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

  if (endPage - startPage < maxVisiblePages - 1) {
    startPage = Math.max(1, endPage - maxVisiblePages + 1);
  }

  for (let i = startPage; i <= endPage; i++) {
    pages.push(i);
  }

  return (
    <nav className="mt-10 flex items-center justify-center gap-2" aria-label="Pagination">
      <button
        type="button"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="flex h-9 px-3 items-center justify-center rounded-xl border border-[#CBD5E1] bg-white text-xs font-semibold text-text-body hover:border-brand-orange hover:text-brand-orange disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-[#CBD5E1] disabled:hover:text-text-body transition-colors"
      >
        Prev
      </button>

      {startPage > 1 && (
        <>
          <button
            type="button"
            onClick={() => onPageChange(1)}
            className={`flex h-9 w-9 items-center justify-center rounded-xl font-body text-xs font-semibold transition-colors ${
              currentPage === 1
                ? "bg-brand-orange text-white"
                : "border border-[#CBD5E1] bg-white text-text-body hover:border-brand-orange hover:text-brand-orange"
            }`}
          >
            1
          </button>
          {startPage > 2 && <span className="text-text-secondary text-xs px-1">...</span>}
        </>
      )}

      {pages.map((page) => (
        <button
          key={page}
          type="button"
          onClick={() => onPageChange(page)}
          className={`flex h-9 w-9 items-center justify-center rounded-xl font-body text-xs font-semibold transition-colors ${
            currentPage === page
              ? "bg-brand-orange text-white"
              : "border border-[#CBD5E1] bg-white text-text-body hover:border-brand-orange hover:text-brand-orange"
          }`}
        >
          {page}
        </button>
      ))}

      {endPage < totalPages && (
        <>
          {endPage < totalPages - 1 && <span className="text-text-secondary text-xs px-1">...</span>}
          <button
            type="button"
            onClick={() => onPageChange(totalPages)}
            className={`flex h-9 w-9 items-center justify-center rounded-xl font-body text-xs font-semibold transition-colors ${
              currentPage === totalPages
                ? "bg-brand-orange text-white"
                : "border border-[#CBD5E1] bg-white text-text-body hover:border-brand-orange hover:text-brand-orange"
            }`}
          >
            {totalPages}
          </button>
        </>
      )}

      <button
        type="button"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="flex h-9 px-3 items-center justify-center rounded-xl border border-[#CBD5E1] bg-white text-xs font-semibold text-text-body hover:border-brand-orange hover:text-brand-orange disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-[#CBD5E1] disabled:hover:text-text-body transition-colors"
      >
        Next
      </button>
    </nav>
  );
}

export default function SchemesPage() {
  const [searchQuery, setSearchQuery] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("search") || "";
  });
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedEligibility, setSelectedEligibility] = useState([]); // Unchecked by default
  const [selectedState, setSelectedState] = useState("All India (Central)");
  const [sortBy, setSortBy] = useState("Popular");
  const [dbSchemes, setDbSchemes] = useState([]);
  const [isLoadingSchemes, setIsLoadingSchemes] = useState(false);
  const [schemesError, setSchemesError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!token) return;
    const fetchSchemes = async () => {
      setIsLoadingSchemes(true);
      setSchemesError("");
      try {
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api"}/schemes`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const res = await response.json();
        if (res.success) {
          const mapped = res.data.map((s) => {
            // Build real eligibility tags dynamically from database properties
            const eligTags = ["Open for All"];
            if (s.eligibility) {
              const el = s.eligibility;
              if (el.womenOnly || (el.genders && el.genders.includes("Female") && !el.genders.includes("Male"))) {
                eligTags.push("Women Only");
              }
              if (el.socialCategories && el.socialCategories.some(c => ["SC", "ST", "OBC"].includes(c))) {
                eligTags.push("SC/ST/OBC");
              }
              const desc = (s.description || "").toLowerCase();
              if (el.annualIncomeMax > 0 || desc.includes("bpl") || desc.includes("poverty") || desc.includes("vulnerable") || desc.includes("deprived")) {
                eligTags.push("Below Poverty Line");
              }
              if (el.minAge >= 60) {
                eligTags.push("Senior Citizens");
              }
            }

            return {
              id: s._id || s.id,
              category: s.category || "General",
              ministry: s.department || s.ministry || "Unknown",
              title: s.title || s.name,
              description: s.description || "",
              badges: s.badgeTag ? [{ label: s.badgeTag, type: "popular" }] : [{ label: s.category || "General", type: "new" }],
              benefit: s.annualBenefit || s.benefit || "Ongoing",
              applicants: s.beneficiaries || "N/A",
              deadline: s.deadline || "Ongoing",
              eligibility: eligTags,
              popularity: s.popularity || 10,
            };
          });
          setDbSchemes(mapped);
        }
      } catch (err) {
        console.error("Error fetching schemes:", err);
        setSchemesError(err?.message || "Unable to load schemes from the database.");
      } finally {
        setIsLoadingSchemes(false);
      }
    };
    fetchSchemes();
  }, [token]);

  // Reset page when search or sorting triggers
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory, selectedEligibility, sortBy]);

  // Debounced search history tracking
  useEffect(() => {
    if (!searchQuery || searchQuery.trim().length < 3) return;

    const delayDebounceFn = setTimeout(async () => {
      try {
        await schemeService.addSearchHistory(searchQuery);
      } catch (err) {
        console.warn("Failed to save search history:", err.message);
      }
    }, 1200);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const filteredSchemes = useMemo(() => {
    let results = [...dbSchemes];
    const query = searchQuery.trim().toLowerCase();

    if (query) {
      results = results.filter(
        (scheme) =>
          (scheme.title || "").toLowerCase().includes(query) ||
          (scheme.ministry || "").toLowerCase().includes(query) ||
          (scheme.description || "").toLowerCase().includes(query) ||
          (scheme.category || "").toLowerCase().includes(query),
      );
    }

    if (selectedCategory !== "All") {
      results = results.filter((scheme) => scheme.category === selectedCategory);
    }

    if (selectedEligibility.length > 0) {
      results = results.filter((scheme) =>
        scheme.eligibility.some((item) => selectedEligibility.includes(item)),
      );
    }

    if (sortBy === "A-Z") {
      results.sort((a, b) => a.title.localeCompare(b.title));
    } else if (sortBy === "Oldest") {
      results.sort((a, b) => b.popularity - a.popularity);
    } else if (sortBy === "Newest") {
      results.sort((a, b) => a.popularity - b.popularity);
    } else {
      results.sort((a, b) => a.popularity - b.popularity);
    }

    return results;
  }, [dbSchemes, searchQuery, selectedCategory, selectedEligibility, sortBy]);

  const totalPages = Math.ceil(filteredSchemes.length / ITEMS_PER_PAGE);
  const paginatedSchemes = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredSchemes.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredSchemes, currentPage]);

  const handleReset = () => {
    setSearchQuery("");
    setSelectedCategory("All");
    setSelectedEligibility([]);
    setSelectedState("All India (Central)");
    setSortBy("Popular");
  };

  return (
    <div className="min-h-screen bg-page-warm flex flex-col justify-between">
      <div>
        <Navbar activeLabel="Explore Schemes" />

        <div className="relative">
          <div className={!token ? "blur-[6px] pointer-events-none select-none" : ""}>
            <section className="border-b border-border-header bg-white">
              <div className="mx-auto max-w-[1440px] px-5 py-10 lg:px-20 lg:py-12">
                <nav className="mb-4 flex items-center gap-3" aria-label="Breadcrumb">
                  <Link
                    to="/"
                    className="font-body text-sm leading-5 text-text-body transition-colors hover:text-brand-orange"
                  >
                    Home
                  </Link>
                  <img src={breadcrumbChevron} alt="" className="h-3 w-2" aria-hidden="true" />
                  <span className="font-body text-sm font-semibold leading-5 text-slate-heading">
                    Explore Schemes
                  </span>
                </nav>

                <h1 className="font-heading text-[30px] font-bold leading-9 tracking-[-0.0367em] text-[#0F172A]">
                  Explore Government Schemes
                </h1>
                <p className="mt-2 max-w-xl font-body text-base font-medium leading-6 text-text-body">
                  Browse 2,400+ welfare schemes from Central and State governments.
                </p>

                <div className="mt-6">
                  <SchemeSearch value={searchQuery} onChange={setSearchQuery} />
                </div>
              </div>
            </section>

            <main className="bg-cream">
              <div className="mx-auto max-w-[1440px] px-5 py-10 lg:px-20">
                <div className="flex flex-col gap-8 lg:flex-row lg:gap-6 xl:gap-10">
                  <PolicyFilter
                    categories={filterCategories}
                    eligibilityOptions={filterEligibility}
                    states={stateOptions}
                    selectedCategory={selectedCategory}
                    onCategoryChange={setSelectedCategory}
                    selectedEligibility={selectedEligibility}
                    onEligibilityChange={setSelectedEligibility}
                    selectedState={selectedState}
                    onStateChange={setSelectedState}
                    onReset={handleReset}
                  />

                  <div className="min-w-0 flex-1">
                    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <p className="font-body text-sm text-text-body">
                        Showing{" "}
                        <span className="font-bold text-slate-heading">{filteredSchemes.length}</span>{" "}
                        schemes
                      </p>

                      <div className="flex items-center gap-3">
                        <span className="font-body text-sm font-medium text-text-body">Sort:</span>
                        <div className="relative">
                          <select
                            value={sortBy}
                            onChange={(event) => setSortBy(event.target.value)}
                            className="h-7 min-w-[107px] appearance-none rounded-full border border-[#CBD5E1] bg-white py-0 pl-3 pr-8 font-body text-sm font-medium text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-orange/30"
                          >
                            {sortOptions.map((option) => (
                              <option key={option} value={option}>
                                {option}
                              </option>
                            ))}
                          </select>
                          <img
                            src={sortDropdownArrow}
                            alt=""
                            className="pointer-events-none absolute right-3 top-1/2 h-[6px] w-3 -translate-y-1/2"
                            aria-hidden="true"
                          />
                        </div>
                      </div>
                    </div>

                    {isLoadingSchemes ? (
                      <p className="rounded-[20px] border border-border-warm bg-white px-6 py-16 text-center text-sm text-text-secondary">
                        Loading schemes from database...
                      </p>
                    ) : schemesError ? (
                      <p role="alert" className="rounded-[20px] border border-red-100 bg-red-50 px-6 py-16 text-center text-sm text-red-700">
                        {schemesError}
                      </p>
                    ) : paginatedSchemes.length > 0 ? (
                      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                        {paginatedSchemes.map((scheme) => (
                          <SchemeCard key={scheme.id} scheme={scheme} />
                        ))}
                      </div>
                    ) : (
                      <div className="rounded-[20px] border border-border-warm bg-white px-6 py-16 text-center">
                        <p className="font-heading text-lg font-bold text-slate-heading">No schemes found</p>
                        <p className="mt-2 font-body text-sm text-text-secondary">
                          Try adjusting your filters or reset them to see all schemes.
                        </p>
                      </div>
                    )}

                    {filteredSchemes.length > 0 && (
                      <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={setCurrentPage}
                      />
                    )}
                  </div>
                </div>
              </div>
            </main>
          </div>

          {!token && <AuthBlocker pageName="Explore Schemes" />}
        </div>
      </div>

      <Footer />
    </div>
  );
}
