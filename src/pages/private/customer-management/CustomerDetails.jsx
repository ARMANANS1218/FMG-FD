import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  ArrowLeft,
  Edit2,
  Save,
  X,
  History,
  Package,
  ExternalLink,
  Eye,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
  Trash2,
} from "lucide-react";
import Select from "react-select";
import { Country, State, City } from "country-state-city";
import { format } from "date-fns";
import {
  useGetCustomerByIdQuery,
  useGetCustomerQueryHistoryQuery,
  useUpdateCustomerDetailsMutation
} from "../../../features/customer/customerApi";

export default function CustomerDetails() {
  const { customerId } = useParams();
  const navigate = useNavigate();

  const [customerData, setCustomerData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("info"); // 'info', 'queries', 'plans'
  const [queryHistory, setQueryHistory] = useState([]);

  // Address dropdowns
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [selectedState, setSelectedState] = useState(null);
  const [selectedCity, setSelectedCity] = useState(null);
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);

  const [formData, setFormData] = useState({
    customerId: "",
    name: "",
    email: "",
    mobile: "",
    alternatePhone: "",
    agentNotes: "",
    address: {
      street: "",
      locality: "",
      city: "",
      state: "",
      country: "",
      countryCode: "",
      stateCode: "",
      postalCode: "",
      landmark: "",
    },
  });

  // Get countries
  const countries = Country.getAllCountries().map((country) => ({
    value: country.isoCode,
    label: country.name,
    name: country.name,
    isoCode: country.isoCode,
  }));

  // RTK Query Hooks
  const {
    data: customerResponse,
    isLoading: isCustomerLoading,
    refetch: refetchCustomer
  } = useGetCustomerByIdQuery(customerId, { skip: !customerId });

  const {
    data: queryHistoryResponse,
    isLoading: isQueryHistoryLoading,
    refetch: refetchQueryHistory
  } = useGetCustomerQueryHistoryQuery(customerId, { skip: !customerId || activeTab !== "queries" });

  const [updateCustomerDetails] = useUpdateCustomerDetailsMutation();

  // Load customer data when RTK Query data changes
  useEffect(() => {
    if (customerResponse?.status && customerResponse?.data) {
      const customer = customerResponse.data;
      setCustomerData(customer);

      setFormData({
        customerId: customer.customerId || "",
        name: customer.name || "",
        email: customer.email || "",
        mobile: customer.mobile || "",
        alternatePhone: customer.alternatePhone || "",
        agentNotes: customer.agentNotes || "",
        address: {
          street: customer.address?.street || "",
          locality: customer.address?.locality || "",
          city: customer.address?.city || "",
          state: customer.address?.state || "",
          country: customer.address?.country || "",
          countryCode: customer.address?.countryCode || "",
          stateCode: customer.address?.stateCode || "",
          postalCode: customer.address?.postalCode || "",
          landmark: customer.address?.landmark || "",
        },
      });

      let foundCountry = null;
      if (customer.address?.countryCode) {
        foundCountry = countries.find((c) => c.isoCode === customer.address.countryCode);
      } else if (customer.address?.country) {
        foundCountry = countries.find((c) => c.name.toLowerCase() === customer.address.country.toLowerCase());
      }

      if (foundCountry) {
        setSelectedCountry(foundCountry);
        const countryStates = State.getStatesOfCountry(foundCountry.isoCode).map((state) => ({
          value: state.isoCode,
          label: state.name,
          name: state.name,
          isoCode: state.isoCode,
          countryCode: state.countryCode,
        }));
        setStates(countryStates);

        let foundState = null;
        const statesList = State.getStatesOfCountry(foundCountry.isoCode);
        if (customer.address?.stateCode) {
          foundState = statesList.find((s) => s.isoCode === customer.address.stateCode);
        } else if (customer.address?.state) {
          foundState = statesList.find((s) => s.name.toLowerCase() === customer.address.state.toLowerCase());
          if (!foundState) {
            foundState = statesList.find((s) => s.name.toLowerCase().includes(customer.address.state.toLowerCase()) || customer.address.state.toLowerCase().includes(s.name.toLowerCase()));
          }
        }

        if (foundState) {
          setSelectedState({
            value: foundState.isoCode,
            label: foundState.name,
            name: foundState.name,
            isoCode: foundState.isoCode,
            countryCode: foundState.countryCode,
          });
          const stateCities = City.getCitiesOfState(foundCountry.isoCode, foundState.isoCode).map((city) => ({
            value: city.name,
            label: city.name,
            name: city.name,
          }));
          setCities(stateCities);
        }
      }

      if (customer.address?.city) {
        setSelectedCity({
          value: customer.address.city,
          label: customer.address.city,
          name: customer.address.city,
        });
      }
    }
  }, [customerResponse]);


  // Update states when country changes (only clear if country is removed)
  useEffect(() => {
    if (selectedCountry) {
      const countryStates = State.getStatesOfCountry(
        selectedCountry.isoCode
      ).map((state) => ({
        value: state.isoCode,
        label: state.name,
        name: state.name,
        isoCode: state.isoCode,
        countryCode: state.countryCode,
      }));
      setStates(countryStates);
    } else {
      setStates([]);
      setCities([]);
      setSelectedState(null);
      setSelectedCity(null);
    }
  }, [selectedCountry]);

  // Update cities when state changes (only clear if state is removed)
  useEffect(() => {
    if (selectedCountry && selectedState) {
      const stateCities = City.getCitiesOfState(
        selectedCountry.isoCode,
        selectedState.isoCode
      ).map((city) => ({
        value: city.name,
        label: city.name,
        name: city.name,
      }));
      setCities(stateCities);
    } else {
      setCities([]);
      setSelectedCity(null);
    }
  }, [selectedState, selectedCountry]);



  // Sync RTK Query history data
  useEffect(() => {
    if (queryHistoryResponse?.status) {
      setQueryHistory(queryHistoryResponse.data || []);
    }
  }, [queryHistoryResponse]);

  // Combined Loading state
  useEffect(() => {
    setLoading(isCustomerLoading);
  }, [isCustomerLoading]);



  const handleSave = async () => {
    setIsSaving(true);
    try {
      const cleanedData = { ...formData };
      await updateCustomerDetails({ id: customerId, data: cleanedData }).unwrap();
      toast.success("Customer updated successfully");
      setIsEditMode(false);
      refetchCustomer();
    } catch (error) {
      console.error("Failed to update customer:", error);
      toast.error(error.data?.message || "Failed to update customer");
    } finally {
      setIsSaving(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.includes(".")) {
      const [parent, child] = name.split(".");
      setFormData((prev) => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value,
        },
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleCountryChange = (selectedOption) => {
    setSelectedCountry(selectedOption);
    setFormData((prev) => ({
      ...prev,
      address: {
        ...prev.address,
        country: selectedOption?.name || "",
        countryCode: selectedOption?.isoCode || "",
        state: "",
        stateCode: "",
        city: "",
      },
    }));
  };

  const handleStateChange = (selectedOption) => {
    setSelectedState(selectedOption);
    setFormData((prev) => ({
      ...prev,
      address: {
        ...prev.address,
        state: selectedOption?.name || "",
        stateCode: selectedOption?.isoCode || "",
        city: "",
      },
    }));
  };

  const handleCityChange = (selectedOption) => {
    setSelectedCity(selectedOption);
    setFormData((prev) => ({
      ...prev,
      address: {
        ...prev.address,
        city: selectedOption?.name || "",
      },
    }));
  };



  const getStatusBadge = (status) => {
    const badges = {
      Pending: {
        color:
          "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
        icon: <Clock size={14} />,
      },
      Accepted: {
        color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
        icon: <CheckCircle size={14} />,
      },
      "In Progress": {
        color:
          "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
        icon: <AlertCircle size={14} />,
      },
      Resolved: {
        color:
          "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
        icon: <CheckCircle size={14} />,
      },
      Expired: {
        color: "bg-muted text-gray-800  dark:text-gray-200",
        icon: <XCircle size={14} />,
      },
      Transferred: {
        color:
          "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
        icon: <AlertCircle size={14} />,
      },
      Active: {
        color:
          "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
        icon: <CheckCircle size={14} />,
      },
      Inactive: {
        color: "bg-muted text-gray-800  dark:text-gray-200",
        icon: <XCircle size={14} />,
      },
      Suspended: {
        color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
        icon: <AlertCircle size={14} />,
      },
    };
    return badges[status] || badges["Pending"];
  };

  const selectStyles = {
    control: (base, state) => ({
      ...base,
      backgroundColor: document.documentElement.classList.contains("dark")
        ? "#374151"
        : "#ffffff",
      borderColor: state.isFocused
        ? "#0d9488"
        : document.documentElement.classList.contains("dark")
          ? "#4b5563"
          : "#d1d5db",
      color: document.documentElement.classList.contains("dark")
        ? "#ffffff"
        : "#111827",
      minHeight: "38px",
      boxShadow: state.isFocused ? "0 0 0 1px #0d9488" : "none",
      "&:hover": { borderColor: "#0d9488" },
    }),
    menu: (base) => ({
      ...base,
      backgroundColor: document.documentElement.classList.contains("dark")
        ? "#374151"
        : "#ffffff",
      border: `1px solid ${document.documentElement.classList.contains("dark")
        ? "#4b5563"
        : "#d1d5db"
        }`,
      zIndex: 9999,
    }),
    option: (base, state) => ({
      ...base,
      backgroundColor: state.isSelected
        ? "#0d9488"
        : state.isFocused
          ? document.documentElement.classList.contains("dark")
            ? "#4b5563"
            : "#f3f4f6"
          : "transparent",
      color: state.isSelected
        ? "white"
        : document.documentElement.classList.contains("dark")
          ? "#ffffff"
          : "#111827",
      cursor: "pointer",
      "&:active": { backgroundColor: "#0f766e" },
    }),
    singleValue: (base) => ({
      ...base,
      color: document.documentElement.classList.contains("dark")
        ? "#ffffff"
        : "#111827",
    }),
    input: (base) => ({
      ...base,
      color: document.documentElement.classList.contains("dark")
        ? "#ffffff"
        : "#111827",
    }),
    placeholder: (base) => ({
      ...base,
      color: document.documentElement.classList.contains("dark")
        ? "#9ca3af"
        : "#6b7280",
    }),
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-muted/50 ">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto"></div>
          <p className="mt-4 text-muted-foreground ">
            Loading customer details...
          </p>
        </div>
      </div>
    );
  }

  if (!customerData) {
    return (
      <div className="flex items-center justify-center h-screen bg-muted/50 ">
        <div className="text-center">
          <AlertCircle size={48} className="text-red-500 mx-auto mb-4" />
          <p className="text-muted-foreground ">Customer not found</p>
          <button
            onClick={() => navigate(-1)}
            className="mt-4 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background ">
      {/* Header */}
      <div className="bg-card  shadow-sm border-b border-border ">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate(-1)}
                className="p-2 hover:bg-muted dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <ArrowLeft
                  size={20}
                  className="text-muted-foreground "
                />
              </button>
              <div className="flex items-center gap-4">
                {customerData.profileImage ? (
                  <img
                    src={customerData.profileImage}
                    alt={customerData.name}
                    className="w-16 h-16 rounded-full object-cover border-2 border-border "
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-xl border-2 border-border ">
                    {customerData.name?.charAt(0).toUpperCase() || "C"}
                  </div>
                )}
                <div>
                  <h1 className="text-2xl font-bold text-foreground">
                    {customerData.name}
                  </h1>
                  <p className="text-sm text-muted-foreground ">
                    Customer ID: {customerData.customerId}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {isEditMode ? (
                <>
                  <button
                    onClick={() => {
                      setIsEditMode(false);
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-200  text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                  >
                    <X size={18} />
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50"
                  >
                    <Save size={18} />
                    {isSaving ? "Saving..." : "Save Changes"}
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setIsEditMode(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
                >
                  <Edit2 size={18} />
                  Edit Customer
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-card  border-b border-border ">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <nav className="flex gap-8">
            <button
              onClick={() => setActiveTab("info")}
              className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${activeTab === "info"
                ? "border-teal-600 bg-primary"
                : "border-transparent text-muted-foreground hover:text-gray-700  dark:hover:text-gray-300"
                }`}
            >
              Customer Info
            </button>
            <button
              onClick={() => setActiveTab("queries")}
              className={`flex items-center gap-2 py-4 px-2 border-b-2 font-medium text-sm transition-colors ${activeTab === "queries"
                ? "border-teal-600 bg-primary"
                : "border-transparent text-muted-foreground hover:text-gray-700  dark:hover:text-gray-300"
                }`}
            >
              <History size={16} />
              Query History
            </button>

          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === "info" && (
          <div className="bg-card  rounded-lg shadow-sm p-6 space-y-6">
            {/* Personal Information */}
            <div>
              <h2 className="text-lg font-semibold text-foreground mb-4">
                Personal Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    disabled={!isEditMode}
                    className="w-full px-3 py-2 border border-border dark:border-gray-600 rounded-lg bg-card  text-foreground disabled:bg-muted dark:disabled:bg-gray-800 disabled:cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    disabled={!isEditMode}
                    className="w-full px-3 py-2 border border-border dark:border-gray-600 rounded-lg bg-card  text-foreground disabled:bg-muted dark:disabled:bg-gray-800 disabled:cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Mobile *
                  </label>
                  <input
                    type="tel"
                    name="mobile"
                    value={formData.mobile}
                    onChange={handleChange}
                    disabled={!isEditMode}
                    className="w-full px-3 py-2 border border-border dark:border-gray-600 rounded-lg bg-card  text-foreground disabled:bg-muted dark:disabled:bg-gray-800 disabled:cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Alternate Phone
                  </label>
                  <input
                    type="tel"
                    name="alternatePhone"
                    value={formData.alternatePhone}
                    onChange={handleChange}
                    disabled={!isEditMode}
                    className="w-full px-3 py-2 border border-border dark:border-gray-600 rounded-lg bg-card  text-foreground disabled:bg-muted dark:disabled:bg-gray-800 disabled:cursor-not-allowed"
                  />
                </div>
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Agent Notes
                </label>
                <textarea
                  name="agentNotes"
                  value={formData.agentNotes}
                  onChange={handleChange}
                  disabled={!isEditMode}
                  rows="3"
                  placeholder="Internal notes for agents only..."
                  className="w-full px-3 py-2 border border-border dark:border-gray-600 rounded-lg bg-card  text-foreground disabled:bg-muted dark:disabled:bg-gray-800 disabled:cursor-not-allowed resize-none"
                />
              </div>
            </div>

            {/* Address */}
            <div>
              <h2 className="text-lg font-semibold text-foreground mb-4">
                Address
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Country
                  </label>
                  <Select
                    value={selectedCountry}
                    onChange={handleCountryChange}
                    options={countries}
                    styles={selectStyles}
                    isDisabled={!isEditMode}
                    placeholder="Select Country"
                    isClearable
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    State
                  </label>
                  <Select
                    value={selectedState}
                    onChange={handleStateChange}
                    options={states}
                    styles={selectStyles}
                    isDisabled={!isEditMode || !selectedCountry}
                    placeholder="Select State"
                    isClearable
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    City
                  </label>
                  <Select
                    value={selectedCity}
                    onChange={handleCityChange}
                    options={cities}
                    styles={selectStyles}
                    isDisabled={!isEditMode || !selectedState}
                    placeholder="Select City"
                    isClearable
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Postal Code
                  </label>
                  <input
                    type="text"
                    name="address.postalCode"
                    value={formData.address.postalCode}
                    onChange={handleChange}
                    disabled={!isEditMode}
                    className="w-full px-3 py-2 border border-border dark:border-gray-600 rounded-lg bg-card  text-foreground disabled:bg-muted dark:disabled:bg-gray-800 disabled:cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Street
                  </label>
                  <input
                    type="text"
                    name="address.street"
                    value={formData.address.street}
                    onChange={handleChange}
                    disabled={!isEditMode}
                    className="w-full px-3 py-2 border border-border dark:border-gray-600 rounded-lg bg-card  text-foreground disabled:bg-muted dark:disabled:bg-gray-800 disabled:cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Locality
                  </label>
                  <input
                    type="text"
                    name="address.locality"
                    value={formData.address.locality}
                    onChange={handleChange}
                    disabled={!isEditMode}
                    className="w-full px-3 py-2 border border-border dark:border-gray-600 rounded-lg bg-card  text-foreground disabled:bg-muted dark:disabled:bg-gray-800 disabled:cursor-not-allowed"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Landmark
                  </label>
                  <input
                    type="text"
                    name="address.landmark"
                    value={formData.address.landmark}
                    onChange={handleChange}
                    disabled={!isEditMode}
                    className="w-full px-3 py-2 border border-border dark:border-gray-600 rounded-lg bg-card  text-foreground disabled:bg-muted dark:disabled:bg-gray-800 disabled:cursor-not-allowed"
                  />
                </div>
              </div>
            </div>


          </div>
        )}

        {activeTab === "queries" && (
          <div className="bg-card  rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">
              Query History
            </h2>
            {isQueryHistoryLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600 mx-auto"></div>
              </div>
            ) : queryHistory.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground ">
                No query history found
              </div>
            ) : (
              <div className="space-y-3">
                {queryHistory.map((query) => {
                  const badge = getStatusBadge(query.status);

                  return (
                    <div
                      key={query._id}
                      className="p-4 border border-border  rounded-lg hover:border-teal-500 dark:hover:border-teal-500 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${badge.color}`}
                            >
                              {badge.icon}
                              {query.status}
                            </span>
                            {query.priority && (
                              <span className="text-xs px-2 py-1 bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200 rounded-full">
                                {query.priority}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground  mb-1">
                            <strong>Subject:</strong>{" "}
                            {query.subject || "No subject"}
                          </p>
                          <p className="text-xs text-muted-foreground dark:text-muted-foreground">
                            Created:{" "}
                            {format(
                              new Date(query.createdAt),
                              "MMM dd, yyyy hh:mm a"
                            )}
                          </p>
                        </div>
                        <button
                          onClick={() =>
                            navigate(
                              `../query/${query.petitionId || query._id}`
                            )
                          }
                          className="flex items-center gap-1 px-3 py-1.5 text-sm bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
                        >
                          <Eye size={14} />
                          View
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
