import { useMemo, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/layouts/Navbar";
import Footer from "../components/layouts/Footer";
import PolicyCard from "../components/policies/PolicyCard";
import PolicyFilter from "../components/policies/PolicyFilter";
import { sortOptions } from "../data/policiesData";
import { policyService } from "../services/policyService";
import breadcrumbChevron from "../assets/icons/policies/breadcrumb-chevron.svg";
import sortDropdownArrow from "../assets/icons/policies/sort-dropdown-arrow.svg";
import AuthBlocker from "../components/auth/AuthBlocker";

const categoryMap = {
  Healthcare: "Healthcare",
  Housing: "Housing",
  Education: "Education",
  "Women Welfare": "Women Welfare",
  "Financial Aid": "Financial Aid",
  Employment: "Employment",
  Agriculture: "Agriculture",
};

function Pagination({ totalPages, currentPage, onPageChange }) {
  if (totalPages <= 1) return null;

  const pages = [];
  for (let i = 1; i <= totalPages; i++) {
    pages.push(i);
  }

  return (
    <nav className="mt-10 flex items-center justify-center gap-3" aria-label="Pagination">
      {/* Prev Button */}
      <button
        type="button"
        disabled={currentPage === 1}
        onClick={() => onPageChange(currentPage - 1)}
        className="px-3 h-9 flex items-center justify-center rounded-full border border-[#CBD5E1] bg-white font-body text-sm font-semibold text-text-body transition-colors hover:border-[#EA580C] hover:text-[#EA580C] disabled:opacity-40 disabled:pointer-events-none"
      >
        Prev
      </button>

      {/* Page Numbers */}
      {pages.map((page) => (
        <button
          key={page}
          type="button"
          onClick={() => onPageChange(page)}
          className={`flex h-9 w-9 items-center justify-center rounded-full font-body text-sm font-semibold transition-colors ${
            currentPage === page
              ? "bg-[#EA580C] text-white"
              : "border border-[#CBD5E1] bg-white text-text-body hover:border-[#EA580C] hover:text-[#EA580C]"
          }`}
          aria-current={currentPage === page ? "page" : undefined}
        >
          {page}
        </button>
      ))}

      {/* Next Button */}
      <button
        type="button"
        disabled={currentPage === totalPages}
        onClick={() => onPageChange(currentPage + 1)}
        className="px-3 h-9 flex items-center justify-center rounded-full border border-[#CBD5E1] bg-white font-body text-sm font-semibold text-text-body transition-colors hover:border-[#EA580C] hover:text-[#EA580C] disabled:opacity-40 disabled:pointer-events-none"
      >
        Next
      </button>
    </nav>
  );
}

export default function PoliciesPage() {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedEligibility, setSelectedEligibility] = useState(["Open for All"]);
  const [selectedState, setSelectedState] = useState("All India (Central)");
  const [sortBy, setSortBy] = useState("Popular");
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [policiesError, setPoliciesError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;
  const token = localStorage.getItem("token");

  // Reset page to 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, selectedEligibility, selectedState, sortBy]);

  useEffect(() => {
    const fetchPolicies = async () => {
      try {
        const data = await policyService.getAll();
        setPolicies(data);
      } catch (err) {
        console.error("Failed to load policies from API:", err);
        setPoliciesError(err?.response?.data?.message || err.message || "Unable to load policies from the database.");
      } finally {
        setLoading(false);
      }
    };
    fetchPolicies();
  }, []);

  const mappedPolicies = useMemo(() => {
    const mapDbCategoryToFilter = (cat) => {
      if (!cat) return "Financial Aid";
      const c = cat.toLowerCase();
      if (c.includes("education")) return "Education";
      if (c.includes("health")) return "Healthcare";
      if (c.includes("housing")) return "Housing";
      if (c.includes("women")) return "Women Welfare";
      if (c.includes("employment") || c.includes("skill") || c.includes("industry") || c.includes("tourism") || c.includes("technology") || c.includes("transport")) return "Employment";
      if (c.includes("agriculture")) return "Agriculture";
      if (c.includes("water") || c.includes("environment")) return "Agriculture";
      return "Financial Aid";
    };

    return policies.map((p) => {
      const filterCategory = mapDbCategoryToFilter(p.category);
      return {
        ...p,
        id: p._id || p.id,
        title: p.title || p.name,
        published: p.published || p.effectiveDate || p.date || "2024",
        category: filterCategory,
        categoryVariant: p.categoryVariant || (filterCategory === "Healthcare" ? "green" : filterCategory === "Employment" ? "greenEmployment" : "orange"),
        eligibility: p.eligibility && p.eligibility.length > 0 ? p.eligibility : ["Open for All"],
      };
    });
  }, [policies]);

  const filteredPolicies = useMemo(() => {
    let results = [...mappedPolicies];

    if (selectedCategory !== "All") {
      const mappedCategory = categoryMap[selectedCategory] || selectedCategory;
      results = results.filter((policy) => policy.category === mappedCategory);
    }

    if (selectedEligibility.length > 0) {
      const isOnlyOpenForAll = selectedEligibility.length === 1 && selectedEligibility[0] === "Open for All";
      
      if (!isOnlyOpenForAll) {
        results = results.filter((policy) => {
          return policy.eligibility.some((item) => {
            const lowerItem = item.toLowerCase();
            
            if (selectedEligibility.includes("Women Only") && lowerItem.includes("women")) {
              return true;
            }
            if (selectedEligibility.includes("Senior Citizens") && (lowerItem.includes("older") || lowerItem.includes("senior") || lowerItem.includes("age"))) {
              return true;
            }
            if (selectedEligibility.includes("SC/ST/OBC") && (lowerItem.includes("disadvantaged") || lowerItem.includes("vulnerable") || lowerItem.includes("minor") || lowerItem.includes("sc") || lowerItem.includes("st") || lowerItem.includes("obc"))) {
              return true;
            }
            if (selectedEligibility.includes("Below Poverty Line") && (lowerItem.includes("bpl") || lowerItem.includes("poverty") || lowerItem.includes("economically"))) {
              return true;
            }
            if (selectedEligibility.includes("Open for All") && (lowerItem.includes("citizen") || lowerItem.includes("all") || lowerItem.includes("household") || lowerItem.includes("people"))) {
              return true;
            }

            return false;
          });
        });
      }
    }

    if (selectedState && selectedState !== "All India (Central)") {
      results = results.filter((policy) => {
        if (!policy.state || policy.state === "All India" || policy.state === "Central" || policy.state === "All India (Central)") {
          return true;
        }
        return policy.state.toLowerCase() === selectedState.toLowerCase();
      });
    }

    if (sortBy === "A-Z") {
      results.sort((a, b) => a.title.localeCompare(b.title));
    } else if (sortBy === "Oldest") {
      results.sort((a, b) => a.published.localeCompare(b.published));
    } else if (sortBy === "Newest") {
      results.sort((a, b) => b.published.localeCompare(a.published));
    }

    return results;
  }, [mappedPolicies, selectedCategory, selectedEligibility, selectedState, sortBy]);

  const paginatedPolicies = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredPolicies.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredPolicies, currentPage]);

  const totalPages = useMemo(() => {
    return Math.ceil(filteredPolicies.length / itemsPerPage);
  }, [filteredPolicies]);

  if (loading) {
    return (
      <div className="min-h-screen bg-page-warm flex flex-col justify-between">
        <div>
          <Navbar activeLabel="Policies" />
          <div className="flex-1 flex items-center justify-center py-32">
            <div className="flex flex-col items-center gap-4">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#EA580C]"></div>
              <p className="text-sm font-semibold text-gray-500">Loading policies from database...</p>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const handleReset = () => {
    setSelectedCategory("All");
    setSelectedEligibility(["Open for All"]);
    setSelectedState("All India (Central)");
    setSortBy("Popular");
  };

  return (
    <div className="min-h-screen bg-page-warm flex flex-col justify-between">
      <div>
        <Navbar activeLabel="Policies" />

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
                  <span className="font-body text-sm font-semibold leading-5 text-slate-heading">Policies</span>
                </nav>

                <h1 className="font-heading text-[30px] font-bold leading-9 tracking-[-0.0367em] text-[#0F172A]">
                  Government Policies
                </h1>
                <p className="mt-2 max-w-xl font-body text-base font-medium leading-6 text-text-body">
                  Explore 850+ official government policies in plain language.
                </p>
              </div>
            </section>

            <main className="bg-cream">
              <div className="mx-auto max-w-[1440px] px-5 py-10 lg:px-20">
                <div className="flex flex-col gap-8 lg:flex-row lg:gap-6 xl:gap-10">
                  <PolicyFilter
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
                        <span className="font-bold text-slate-heading">{filteredPolicies.length}</span>{" "}
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

                    {policiesError ? (
                      <div role="alert" className="rounded-[20px] border border-red-100 bg-red-50 px-6 py-16 text-center text-sm text-red-700">
                        {policiesError}
                      </div>
                    ) : filteredPolicies.length > 0 ? (
                      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                        {paginatedPolicies.map((policy) => (
                          <PolicyCard key={policy.id} policy={policy} />
                        ))}
                      </div>
                    ) : (
                      <div className="rounded-[20px] border border-border-warm bg-white px-6 py-16 text-center">
                        <p className="font-heading text-lg font-bold text-slate-heading">No policies found</p>
                        <p className="mt-2 font-body text-sm text-text-secondary">
                          Try adjusting your filters or reset them to see all policies.
                        </p>
                      </div>
                    )}

                    {filteredPolicies.length > 0 && (
                      <Pagination
                        totalPages={totalPages}
                        currentPage={currentPage}
                        onPageChange={setCurrentPage}
                      />
                    )}
                  </div>
                </div>
              </div>
            </main>
          </div>

          {!token && <AuthBlocker pageName="Policies" />}
        </div>
      </div>

      <Footer />
    </div>
  );
}
