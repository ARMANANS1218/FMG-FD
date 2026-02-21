import React, { useState, useEffect } from 'react';
import {
  X,
  Save,
  Search,
  User,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  Calendar,
  FileText,
  Building,
  Hash,
  Globe,
  Edit2,
  ChevronLeft,
  ChevronRight,
  Plus,
  History,
  ExternalLink,
  Eye,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
} from 'lucide-react';
import { toast } from 'react-toastify';
import Select from 'react-select';
import { Country, State, City } from 'country-state-city';
import { format } from 'date-fns';

export default function CustomerDetailsPanel({
  isOpen,
  onClose,
  customerId = null,
  petitionId = null, // Current query petition ID
  queryCustomerInfo = null, // Info from query (name, email from widget)
  initialProfileImage = null, // Image from chat
  onSave,
}) {
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [totalCustomers, setTotalCustomers] = useState(0);
  const [customerList, setCustomerList] = useState([]);
  const [isLoadingList, setIsLoadingList] = useState(false);

  // Query History
  const [activeTab, setActiveTab] = useState('info'); // 'info', 'queries'
  const [queryHistory, setQueryHistory] = useState([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // Address selection state
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [selectedState, setSelectedState] = useState(null);
  const [selectedCity, setSelectedCity] = useState(null);
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);

  const initialFormState = {
    customerId: '',
    name: '',
    email: '',
    mobile: '',
    alternatePhone: '',
    title: '',
    dateOfBirth: '',
    gender: '',
    nationality: '',
    preferredLanguage: 'English',
    frequentFlyerNumber: '',
    agentNotes: '',
    travelDocument: {
      documentType: '',
      documentNumber: '',
      issuingCountry: '',
      issueDate: '',
      expiryDate: '',
    },
    travelPreferences: {
      mealPreference: 'Regular',
      seatPreference: 'No Preference',
      specialAssistance: '',
    },
    emergencyContact: {
      name: '',
      relationship: '',
      phone: '',
      email: '',
    },
    address: {
      street: '',
      locality: '',
      city: '',
      state: '',
      country: '',
      countryCode: '',
      stateCode: '',
      postalCode: '',
      landmark: '',
    },
    profileImage: '',
  };

  const [formData, setFormData] = useState(initialFormState);

  // Get all countries for dropdown
  const countries = Country.getAllCountries().map((country) => ({
    value: country.isoCode,
    label: country.name,
    name: country.name,
    isoCode: country.isoCode,
  }));

  // Fetch query history for a customer
  const fetchQueryHistory = async (targetCustomerId) => {
    console.log('📋 Fetching query history for customer:', targetCustomerId);
    setIsLoadingHistory(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/v1/customer/${targetCustomerId}/query-history`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );
      const data = await response.json();
      console.log('📋 Query history response:', data);
      if (data.status) {
        setQueryHistory(data.data || []);
        console.log('✅ Query history loaded:', data.data?.length || 0, 'queries');
      }
    } catch (error) {
      console.error('Failed to fetch query history:', error);
      toast.error('Failed to load query history');
    } finally {
      setIsLoadingHistory(false);
    }
  };

  // Add current query to customer
  const handleAddQueryToCustomer = async (targetCustomerId) => {
    console.log('➕ Adding query to customer:', {
      customerId: targetCustomerId,
      petitionId,
    });
    if (!petitionId) {
      toast.error('No query to add');
      return;
    }

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/customer/add-query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          customerId: targetCustomerId,
          petitionId,
        }),
      });
      const data = await response.json();
      console.log('➕ Add query response:', data);
      if (data.status) {
        toast.success('Query added to customer history');
        console.log('✅ Query added successfully');
        if (activeTab === 'queries') {
          fetchQueryHistory(targetCustomerId);
        }
      } else {
        console.error('❌ Failed to add query:', data.message);
        toast.error(data.message || 'Failed to add query');
      }
    } catch (error) {
      toast.error('Failed to add query to customer');
    }
  };

  // Get status badge for query status
  const getStatusBadge = (status) => {
    const badges = {
      Pending: {
        color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
        icon: <Clock size={14} />,
      },
      Accepted: {
        color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
        icon: <CheckCircle size={14} />,
      },
      'In Progress': {
        color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
        icon: <AlertCircle size={14} />,
      },
      Resolved: {
        color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
        icon: <CheckCircle size={14} />,
      },
      Expired: {
        color: 'bg-muted text-gray-800  dark:text-gray-200',
        icon: <XCircle size={14} />,
      },
      Transferred: {
        color: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
        icon: <AlertCircle size={14} />,
      },
      Active: {
        color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
        icon: <CheckCircle size={14} />,
      },
      Inactive: {
        color: 'bg-muted text-gray-800  dark:text-gray-200',
        icon: <XCircle size={14} />,
      },
      Suspended: {
        color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
        icon: <AlertCircle size={14} />,
      },
    };
    return badges[status] || badges['Pending'];
  };

  // Reset form to initial state
  const resetForm = () => {
    setFormData(initialFormState);
    setSelectedCountry(null);
    setSelectedState(null);
    setSelectedCity(null);
    setSelectedCustomerId(null);
    setIsEditMode(false);
    setIsCreatingNew(false);
    setQueryHistory([]);
    setActiveTab('info');
  };

  // Load recent customers on mount
  useEffect(() => {
    if (isOpen && !isSearchMode) {
      fetchRecentCustomers();
    }
  }, [isOpen, currentPage, itemsPerPage]);

  // Initialize with query customer info if available
  useEffect(() => {
    if (queryCustomerInfo && !customerId) {
      setFormData((prev) => ({
        ...prev,
        name: queryCustomerInfo.name || '',
        email: queryCustomerInfo.email || '',
        mobile: queryCustomerInfo.mobile || '',
        // profileImage is handled separately below to allow override
      }));
    }
  }, [queryCustomerInfo, customerId]);

  // Handle profile image override from chat
  // Handle profile image override from chat
  // Handle profile image override from chat
  useEffect(() => {
    // Apply initialProfileImage if provided, regardless of whether it's a new or existing customer
    // This allows overriding the profile image from chat for existing customers
    if (initialProfileImage) {
      setFormData((prev) => ({
        ...prev,
        profileImage: initialProfileImage,
      }));
    }
  }, [initialProfileImage]);

  // Update states when country changes
  useEffect(() => {
    if (selectedCountry) {
      const countryStates = State.getStatesOfCountry(selectedCountry.isoCode).map((state) => ({
        value: state.isoCode,
        label: state.name,
        name: state.name,
        isoCode: state.isoCode,
        countryCode: state.countryCode,
      }));
      setStates(countryStates);
      // Don't clear selections here - let change handlers manage that
    } else {
      setStates([]);
      setCities([]);
      setSelectedState(null);
      setSelectedCity(null);
    }
  }, [selectedCountry]);

  // Update cities when state changes
  useEffect(() => {
    if (selectedCountry && selectedState) {
      const stateCities = City.getCitiesOfState(selectedCountry.isoCode, selectedState.isoCode).map(
        (city) => ({
          value: city.name,
          label: city.name,
          name: city.name,
        })
      );
      setCities(stateCities);
      // Don't clear city selection here - let change handlers manage that
    } else {
      setCities([]);
      setSelectedCity(null);
    }
  }, [selectedState, selectedCountry]);

  // Load existing customer data if customerId provided
  useEffect(() => {
    if (customerId && isOpen) {
      fetchCustomerData(customerId);
    }
  }, [customerId, isOpen]);

  // Load query history when tab changes
  useEffect(() => {
    console.log('🔄 Tab or customer changed:', {
      activeTab,
      selectedCustomerId,
      customerId,
    });
    if (selectedCustomerId || customerId) {
      const targetId = selectedCustomerId || customerId;
      if (activeTab === 'queries') {
        fetchQueryHistory(targetId);
      }
    }
  }, [activeTab, selectedCustomerId, customerId]);

  const fetchCustomerData = async (id) => {
    // console.log('🔵 === FETCHING CUSTOMER DATA ===', id);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/customer/${id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      console.log('response: ', response);
      const data = await response.json();
      // console.log('📦 Customer data received:', data.data);
      if (data.status) {
        const customerData = data.data;
        // console.log('🏠 Customer address:', customerData.address);
        setFormData({
          customerId: customerData.customerId || '',
          name: customerData.name || '',
          email: customerData.email || '',
          mobile: customerData.mobile || '',
          alternatePhone: customerData.alternatePhone || '',
          title: customerData.title || '',
          dateOfBirth: customerData.dateOfBirth
            ? customerData.dateOfBirth.split('T')[0]
            : '',
          gender: customerData.gender || '',
          nationality: customerData.nationality || '',
          preferredLanguage: customerData.preferredLanguage || 'English',
          frequentFlyerNumber: customerData.frequentFlyerNumber || '',
          agentNotes: customerData.agentNotes || '',
          travelDocument: {
            documentType: customerData.travelDocument?.documentType || '',
            documentNumber: customerData.travelDocument?.documentNumber || '',
            issuingCountry: customerData.travelDocument?.issuingCountry || '',
            issueDate: customerData.travelDocument?.issueDate
              ? customerData.travelDocument.issueDate.split('T')[0]
              : '',
            expiryDate: customerData.travelDocument?.expiryDate
              ? customerData.travelDocument.expiryDate.split('T')[0]
              : '',
          },
          travelPreferences: {
            mealPreference: customerData.travelPreferences?.mealPreference || 'Regular',
            seatPreference: customerData.travelPreferences?.seatPreference || 'No Preference',
            specialAssistance: customerData.travelPreferences?.specialAssistance || '',
          },
          emergencyContact: {
            name: customerData.emergencyContact?.name || '',
            relationship: customerData.emergencyContact?.relationship || '',
            phone: customerData.emergencyContact?.phone || '',
            email: customerData.emergencyContact?.email || '',
          },
          address: {
            street: customerData.address?.street || '',
            locality: customerData.address?.locality || '',
            city: customerData.address?.city || '',
            state: customerData.address?.state || '',
            country: customerData.address?.country || '',
            countryCode: customerData.address?.countryCode || '',
            stateCode: customerData.address?.stateCode || '',
            postalCode: customerData.address?.postalCode || '',
            landmark: customerData.address?.landmark || '',
          },
          // Use initialProfileImage if provided (override), otherwise use existing profile image
          profileImage: initialProfileImage || customerData.profileImage || '',
        });

        // Set selected country, state, city for dropdowns
        let foundCountry = null;
        if (customerData.address?.countryCode) {
          foundCountry = countries.find((c) => c.isoCode === customerData.address.countryCode);
        } else if (customerData.address?.country) {
          // Fallback: search by country name
          foundCountry = countries.find(
            (c) => c.name.toLowerCase() === customerData.address.country.toLowerCase()
          );
        }

        if (foundCountry) {
          setSelectedCountry(foundCountry);

          // Load states for this country
          const countryStates = State.getStatesOfCountry(foundCountry.isoCode).map((state) => ({
            value: state.isoCode,
            label: state.name,
            name: state.name,
            isoCode: state.isoCode,
            countryCode: state.countryCode,
          }));
          setStates(countryStates);

          // Update form data with country code if it was missing
          if (!customerData.address.countryCode) {
            setFormData((prev) => ({
              ...prev,
              address: {
                ...prev.address,
                countryCode: foundCountry.isoCode,
              },
            }));
          }
        }
        // Set state dropdown
        if (foundCountry) {
          let foundState = null;
          const countryCode = foundCountry.isoCode;
          const statesList = State.getStatesOfCountry(countryCode);

          // console.log('🗺️ Loading state for country:', countryCode);
          // console.log('📍 Customer state data:', customerData.address?.state, 'Code:', customerData.address?.stateCode);
          // console.log('📋 Available states:', statesList.map(s => s.name));

          if (customerData.address?.stateCode) {
            foundState = statesList.find((s) => s.isoCode === customerData.address.stateCode);
            // console.log('🔍 Found state by code:', foundState?.name);
          } else if (customerData.address?.state) {
            // Try exact match first
            foundState = statesList.find(
              (s) => s.name.toLowerCase() === customerData.address.state.toLowerCase()
            );

            // If not found, try partial match
            if (!foundState) {
              foundState = statesList.find(
                (s) =>
                  s.name.toLowerCase().includes(customerData.address.state.toLowerCase()) ||
                  customerData.address.state.toLowerCase().includes(s.name.toLowerCase())
              );
            }
            // console.log('🔍 Found state by name:', foundState?.name);
          }

          if (foundState) {
            const stateObj = {
              value: foundState.isoCode,
              label: foundState.name,
              name: foundState.name,
              isoCode: foundState.isoCode,
              countryCode: foundState.countryCode,
            };
            setSelectedState(stateObj);

            // Load cities for this state
            const stateCities = City.getCitiesOfState(countryCode, foundState.isoCode).map(
              (city) => ({
                value: city.name,
                label: city.name,
                name: city.name,
              })
            );
            setCities(stateCities);
            // console.log('🏙️ Loaded cities:', stateCities.length, 'cities');

            // Update form data with state code if it was missing
            if (!customerData.address.stateCode) {
              setFormData((prev) => ({
                ...prev,
                address: {
                  ...prev.address,
                  stateCode: foundState.isoCode,
                },
              }));
            }
          } else {
            // console.log('❌ State not found in state list for:', customerData.address?.state);
          }
        }
        if (customerData.address?.city) {
          setSelectedCity({
            value: customerData.address.city,
            label: customerData.address.city,
            name: customerData.address.city,
          });
        }
      }
    } catch (error) {
      toast.error('Failed to load customer data');
    }
  };

  const fetchRecentCustomers = async () => {
    setIsLoadingList(true);
    try {
      const response = await fetch(
        `${
          import.meta.env.VITE_API_URL
        }/api/v1/customer/list?page=${currentPage}&limit=${itemsPerPage}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );
      const data = await response.json();
      if (data.status) {
        setCustomerList(data.data || []);
        setTotalCustomers(data.total || 0);
      }
    } catch (error) {
      console.error('Failed to fetch customers:', error);
    } finally {
      setIsLoadingList(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setIsSearchMode(false);
      fetchRecentCustomers();
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/v1/customer/search?q=${encodeURIComponent(
          searchQuery
        )}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );
      const data = await response.json();
      if (data.status) {
        setSearchResults(data.data || []);
        if (data.data.length === 0) {
          toast.info('No customers found');
        }
      }
    } catch (error) {
      toast.error('Search failed');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectCustomer = (customer) => {
    // console.log('🟢 === SELECTING CUSTOMER ===', customer._id);
    // console.log('🏠 Customer address data:', customer.address);
    setSelectedCustomerId(customer._id);
    setIsEditMode(false); // Start in view mode
    setIsCreatingNew(false);
    setFormData({
      customerId: customer.customerId || '',
      name: customer.name || '',
      email: customer.email || '',
      mobile: customer.mobile || '',
      alternatePhone: customer.alternatePhone || '',
      title: customer.title || '',
      dateOfBirth: customer.dateOfBirth
        ? customer.dateOfBirth.split('T')[0]
        : '',
      gender: customer.gender || '',
      nationality: customer.nationality || '',
      preferredLanguage: customer.preferredLanguage || 'English',
      frequentFlyerNumber: customer.frequentFlyerNumber || '',
      agentNotes: customer.agentNotes || '',
      travelDocument: {
        documentType: customer.travelDocument?.documentType || '',
        documentNumber: customer.travelDocument?.documentNumber || '',
        issuingCountry: customer.travelDocument?.issuingCountry || '',
        issueDate: customer.travelDocument?.issueDate
          ? customer.travelDocument.issueDate.split('T')[0]
          : '',
        expiryDate: customer.travelDocument?.expiryDate
          ? customer.travelDocument.expiryDate.split('T')[0]
          : '',
      },
      travelPreferences: {
        mealPreference: customer.travelPreferences?.mealPreference || 'Regular',
        seatPreference: customer.travelPreferences?.seatPreference || 'No Preference',
        specialAssistance: customer.travelPreferences?.specialAssistance || '',
      },
      emergencyContact: {
        name: customer.emergencyContact?.name || '',
        relationship: customer.emergencyContact?.relationship || '',
        phone: customer.emergencyContact?.phone || '',
        email: customer.emergencyContact?.email || '',
      },
      address: {
        street: customer.address?.street || '',
        locality: customer.address?.locality || '',
        city: customer.address?.city || '',
        state: customer.address?.state || '',
        country: customer.address?.country || '',
        countryCode: customer.address?.countryCode || '',
        stateCode: customer.address?.stateCode || '',
        postalCode: customer.address?.postalCode || '',
        landmark: customer.address?.landmark || '',
      },
      // Use existing profile image, or fallback to the one from chat if none exists
      profileImage: customer.profileImage || initialProfileImage || '',
    });

    // Set selected country, state, city for dropdowns
    let foundCountry = null;
    if (customer.address?.countryCode) {
      foundCountry = countries.find((c) => c.isoCode === customer.address.countryCode);
    } else if (customer.address?.country) {
      // Fallback: search by country name
      foundCountry = countries.find(
        (c) => c.name.toLowerCase() === customer.address.country.toLowerCase()
      );
    }

    if (foundCountry) {
      setSelectedCountry(foundCountry);

      // Load states for this country
      const countryStates = State.getStatesOfCountry(foundCountry.isoCode).map((state) => ({
        value: state.isoCode,
        label: state.name,
        name: state.name,
        isoCode: state.isoCode,
        countryCode: state.countryCode,
      }));
      setStates(countryStates);
    }
    // Set state dropdown
    if (foundCountry) {
      let foundState = null;
      const countryCode = foundCountry.isoCode;
      const statesList = State.getStatesOfCountry(countryCode);

      // console.log('🗺️ Loading state for country:', countryCode);
      // console.log('📍 Customer state data:', customer.address?.state, 'Code:', customer.address?.stateCode);
      // console.log('📋 Available states:', statesList.map(s => s.name));

      if (customer.address?.stateCode) {
        foundState = statesList.find((s) => s.isoCode === customer.address.stateCode);
        // console.log('🔍 Found state by code:', foundState?.name);
      } else if (customer.address?.state) {
        // Try exact match first
        foundState = statesList.find(
          (s) => s.name.toLowerCase() === customer.address.state.toLowerCase()
        );

        // If not found, try partial match
        if (!foundState) {
          foundState = statesList.find(
            (s) =>
              s.name.toLowerCase().includes(customer.address.state.toLowerCase()) ||
              customer.address.state.toLowerCase().includes(s.name.toLowerCase())
          );
        }
        // console.log('🔍 Found state by name:', foundState?.name);
      }

      if (foundState) {
        const stateObj = {
          value: foundState.isoCode,
          label: foundState.name,
          name: foundState.name,
          isoCode: foundState.isoCode,
          countryCode: foundState.countryCode,
        };
        setSelectedState(stateObj);

        // Load cities for this state
        const stateCities = City.getCitiesOfState(countryCode, foundState.isoCode).map((city) => ({
          value: city.name,
          label: city.name,
          name: city.name,
        }));
        setCities(stateCities);
        // console.log('🏙️ Loaded cities:', stateCities.length, 'cities');
      } else {
        // console.log('❌ State not found in state list');
      }
    }
    if (customer.address?.city) {
      setSelectedCity({
        value: customer.address.city,
        label: customer.address.city,
        name: customer.address.city,
      });
    }

    setIsSearchMode(false);
    setSearchResults([]);
    setSearchQuery('');
  };

  // Handle country selection
  const handleCountryChange = (selectedOption) => {
    setSelectedCountry(selectedOption);
    setFormData((prev) => ({
      ...prev,
      address: {
        ...prev.address,
        country: selectedOption?.name || '',
        countryCode: selectedOption?.isoCode || '',
        state: '',
        stateCode: '',
        city: '',
      },
    }));
  };

  // Handle state selection
  const handleStateChange = (selectedOption) => {
    setSelectedState(selectedOption);
    setFormData((prev) => ({
      ...prev,
      address: {
        ...prev.address,
        state: selectedOption?.name || '',
        stateCode: selectedOption?.isoCode || '',
        city: '',
      },
    }));
  };

  // Handle city selection
  const handleCityChange = (selectedOption) => {
    setSelectedCity(selectedOption);
    setFormData((prev) => ({
      ...prev,
      address: {
        ...prev.address,
        city: selectedOption?.name || '',
      },
    }));
  };

  // Validate pincode based on country
  const validatePostalCode = (postalCode, countryCode) => {
    if (!postalCode) return true; // Optional field

    const patterns = {
      IN: /^[1-9][0-9]{5}$/, // India: 6 digits
      US: /^[0-9]{5}(-[0-9]{4})?$/, // USA: 5 or 5+4 digits
      GB: /^[A-Z]{1,2}[0-9]{1,2}[A-Z]?\s?[0-9][A-Z]{2}$/i, // UK
      CA: /^[A-Z][0-9][A-Z]\s?[0-9][A-Z][0-9]$/i, // Canada
      AU: /^[0-9]{4}$/, // Australia: 4 digits
      JP: /^[0-9]{3}-[0-9]{4}$/, // Japan: XXX-XXXX
      CN: /^[0-9]{6}$/, // China: 6 digits
      BR: /^[0-9]{5}-[0-9]{3}$/, // Brazil: XXXXX-XXX
      DE: /^[0-9]{5}$/, // Germany: 5 digits
      FR: /^[0-9]{5}$/, // France: 5 digits
    };

    const pattern = patterns[countryCode];
    if (pattern) {
      return pattern.test(postalCode);
    }

    // Default: allow alphanumeric and spaces
    return /^[A-Z0-9\s-]{3,10}$/i.test(postalCode);
  };

  // Custom styles for react-select to match dark mode
  const selectStyles = {
    control: (base, state) => ({
      ...base,
      backgroundColor: 'var(--select-bg)',
      borderColor: state.isFocused ? '#0d9488' : 'var(--select-border)',
      color: 'var(--select-text)',
      minHeight: '38px',
      boxShadow: state.isFocused ? '0 0 0 1px #0d9488' : 'none',
      '&:hover': {
        borderColor: '#0d9488',
      },
    }),
    menu: (base) => ({
      ...base,
      backgroundColor: 'var(--select-bg)',
      border: '1px solid var(--select-border)',
      zIndex: 9999,
    }),
    option: (base, state) => ({
      ...base,
      backgroundColor: state.isSelected
        ? '#0d9488'
        : state.isFocused
        ? 'var(--select-hover)'
        : 'transparent',
      color: state.isSelected ? 'white' : 'var(--select-text)',
      cursor: 'pointer',
      '&:active': {
        backgroundColor: '#0f766e',
      },
    }),
    singleValue: (base) => ({
      ...base,
      color: 'var(--select-text)',
    }),
    input: (base) => ({
      ...base,
      color: 'var(--select-text)',
    }),
    placeholder: (base) => ({
      ...base,
      color: 'var(--select-placeholder)',
    }),
  };

  const handleSave = async () => {
    if (!formData.name || !formData.email || !formData.mobile) {
      toast.error('Name, Email, and Mobile are required');
      return;
    }

    setIsSaving(true);
    try {
      const isUpdate = customerId || selectedCustomerId;
      const url = isUpdate
        ? `${import.meta.env.VITE_API_URL}/api/v1/customer/${customerId || selectedCustomerId}`
        : `${import.meta.env.VITE_API_URL}/api/v1/customer/create`;

      const method = isUpdate ? 'PUT' : 'POST';

      // Clean formData - remove empty travelDocument and other empty objects
      const cleanedData = { ...formData };
      
      if (!cleanedData.travelDocument?.documentType || cleanedData.travelDocument.documentType.trim() === '') {
        cleanedData.travelDocument = null;
      }

      // Clean emergency contact if name is empty
      if (!cleanedData.emergencyContact?.name || cleanedData.emergencyContact.name.trim() === '') {
        cleanedData.emergencyContact = null;
      }

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(cleanedData),
      });

      const data = await response.json();
      if (data.status) {
        toast.success(isUpdate ? 'Customer updated successfully' : 'Customer created successfully');
        if (onSave) onSave(data.data);
        if (isEditMode) {
          setIsEditMode(false); // Exit edit mode after save
        }
        if (isCreatingNew) {
          setIsCreatingNew(false); // Exit creation mode after save
        }
        if (!isUpdate) {
          onClose(); // Close panel only on create
        }
      } else {
        toast.error(data.message || 'Operation failed');
      }
    } catch (error) {
      toast.error('Failed to save customer data');
    } finally {
      setIsSaving(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData((prev) => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value,
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="h-full flex flex-col bg-card  border-l border-border ">
      <style>{`
        :root {
          --select-bg: white;
          --select-border: #d1d5db;
          --select-hover: #f3f4f6;
          --select-text: #111827;
          --select-placeholder: #9ca3af;
        }
        .dark {
          --select-bg: #1f2937;
          --select-border: #4b5563;
          --select-hover: #374151;
          --select-text: #f9fafb;
          --select-placeholder: #6b7280;
        }
      `}</style>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border  bg-gradient-to-r from-slate-800 to-slate-950 text-white">
        <div className="flex items-center gap-2">
          <User size={20} />
          <h3 className="font-semibold text-lg">
            {isSearchMode
              ? 'Search Customers'
              : isEditMode || selectedCustomerId || customerId
              ? 'Update Customer'
              : queryCustomerInfo || isCreatingNew
              ? 'Create Customer'
              : 'Customer List'}
          </h3>
        </div>
        <div className="flex items-center gap-2">
          {!isSearchMode && selectedCustomerId && !isEditMode && (
            <button
              onClick={() => setIsEditMode(true)}
              className="p-2 hover:bg-teal-800 rounded-lg transition-colors"
              title="Edit Customer"
            >
              <Edit2 size={18} />
            </button>
          )}
          {!isSearchMode && petitionId && (selectedCustomerId || customerId) && (
            <button
              onClick={() => handleAddQueryToCustomer(selectedCustomerId || customerId)}
              className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 rounded-lg transition-colors text-sm font-medium flex items-center gap-1"
              title="Add current query to this customer"
            >
              <Plus size={16} />
              Add Query
            </button>
          )}
          {!isSearchMode && (
            <button
              onClick={() => setIsSearchMode(true)}
              className="p-2 hover:bg-teal-800 rounded-lg transition-colors"
              title="Search Customer"
            >
              <Search size={18} />
            </button>
          )}
          <button onClick={onClose} className="p-2 hover:bg-teal-800 rounded-lg transition-colors">
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Tabs (only show when a customer is selected) */}
      {(selectedCustomerId || customerId) && !isSearchMode && (
        <div className="flex border-b border-border  bg-card ">
          <button
            onClick={() => setActiveTab('info')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'info'
                ? 'bg-primary  border-b-2 border-teal-600 dark:border-teal-400'
                : 'text-muted-foreground  hover:text-foreground dark:hover:text-white'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <User size={16} />
              Customer Info
            </div>
          </button>
          <button
            onClick={() => setActiveTab('queries')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'queries'
                ? 'bg-primary  border-b-2 border-teal-600 dark:border-teal-400'
                : 'text-muted-foreground  hover:text-foreground dark:hover:text-white'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <History size={16} />
              Query History
            </div>
          </button>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {isSearchMode ? (
          <div className="space-y-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Search by name, email, phone, or customer ID..."
                className="flex-1 px-3 py-2 border border-border dark:border-gray-600 rounded-lg bg-card  text-foreground"
              />
              <button
                onClick={handleSearch}
                disabled={isSearching}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                {isSearching ? 'Searching...' : 'Search'}
              </button>
              <button
                onClick={() => {
                  setIsSearchMode(false);
                  setSearchResults([]);
                  setSearchQuery('');
                }}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>

            {searchResults.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground ">
                  Found {searchResults.length} customer(s)
                </p>
                {searchResults.map((customer) => (
                  <div
                    key={customer._id}
                    onClick={() => handleSelectCustomer(customer)}
                    className="p-3 border border-border  rounded-lg hover:bg-muted/50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-foreground">{customer.name}</p>
                        <p className="text-sm text-muted-foreground ">{customer.email}</p>
                        <p className="text-sm text-muted-foreground ">
                          {customer.mobile}
                        </p>
                      </div>
                      {customer.customerId && (
                        <span className="px-2 py-1 bg-teal-100  text-teal-800 dark:text-teal-200 text-xs rounded">
                          {customer.customerId}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : !selectedCustomerId && !queryCustomerInfo && !isCreatingNew ? (
          <div className="space-y-4">
            {/* Recent Customers List */}
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold text-foreground">Recent Customers</h4>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    setIsCreatingNew(true);
                    setSelectedCustomerId(null);
                    setIsEditMode(false);
                  }}
                  className="px-3 py-1.5 bg-gradient-to-r from-teal-600 to-cyan-700 hover:from-teal-700 hover:to-cyan-800 text-white rounded-lg text-sm font-medium transition-all flex items-center gap-1 shadow-md"
                >
                  <Plus size={16} />
                  Create New
                </button>
                <div className="flex items-center gap-2">
                  <label className="text-sm text-muted-foreground ">Per page:</label>
                  <select
                    value={itemsPerPage}
                    onChange={(e) => {
                      setItemsPerPage(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="px-2 py-1 border border-border dark:border-gray-600 rounded bg-card  text-foreground text-sm"
                  >
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                </div>
              </div>
            </div>

            {isLoadingList ? (
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
              </div>
            ) : customerList.length > 0 ? (
              <div className="space-y-2">
                {customerList.map((customer) => (
                  <div
                    key={customer._id}
                    onClick={() => handleSelectCustomer(customer)}
                    className="p-3 border border-border  rounded-lg hover:bg-muted/50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-foreground">{customer.name}</p>
                        <p className="text-sm text-muted-foreground ">{customer.email}</p>
                        <p className="text-sm text-muted-foreground ">
                          {customer.mobile}
                        </p>
                      </div>
                      {customer.customerId && (
                        <span className="px-2 py-1 bg-teal-100  text-teal-800 dark:text-teal-200 text-xs rounded">
                          {customer.customerId}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground ">
                No customers found
              </div>
            )}

            {/* Pagination Controls */}
            {totalCustomers > 0 && (
              <div className="flex items-center justify-between pt-4 border-t border-border ">
                <p className="text-sm text-muted-foreground ">
                  Showing {(currentPage - 1) * itemsPerPage + 1} -{' '}
                  {Math.min(currentPage * itemsPerPage, totalCustomers)} of {totalCustomers}{' '}
                  customers
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 border border-border dark:border-gray-600 rounded hover:bg-muted dark:hover:bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 dark:text-gray-300 flex items-center gap-1"
                  >
                    <ChevronLeft size={16} />
                    Previous
                  </button>
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Page {currentPage} of {Math.ceil(totalCustomers / itemsPerPage)}
                  </span>
                  <button
                    onClick={() =>
                      setCurrentPage((prev) =>
                        Math.min(Math.ceil(totalCustomers / itemsPerPage), prev + 1)
                      )
                    }
                    disabled={currentPage >= Math.ceil(totalCustomers / itemsPerPage)}
                    className="px-3 py-1 border border-border dark:border-gray-600 rounded hover:bg-muted dark:hover:bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 dark:text-gray-300 flex items-center gap-1"
                  >
                    Next
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : activeTab === 'info' ? (
          <form className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h4 className="font-semibold text-foreground flex items-center gap-2">
                <User size={18} />
                Basic Information
              </h4>

              {/* Profile Image Display */}
              <div className="flex justify-center mb-6">
                <div className="relative group">
                  <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-border  bg-muted  flex items-center justify-center shadow-sm">
                    {formData.profileImage ? (
                      <img
                        src={formData.profileImage}
                        alt="Profile"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.onerror = null;
                          // e.target.src = ''; // Keep broken image or fallback?
                          // Better to hide image and show icon if broken
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'block';
                        }}
                      />
                    ) : (
                      <User size={40} className="text-gray-400 dark:text-muted-foreground" />
                    )}
                    {/* Fallback icon if image hidden via onError */}
                    <User size={40} className="text-gray-400 dark:text-muted-foreground absolute hidden" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Customer ID
                  </label>
                  <input
                    type="text"
                    name="customerId"
                    value={formData.customerId}
                    onChange={handleChange}
                    placeholder="Auto-generated (BM/8-digits/YY)"
                    readOnly={selectedCustomerId && !isEditMode}
                    className={`w-full px-3 py-2 border border-border dark:border-gray-600 rounded-lg text-foreground text-sm ${
                      selectedCustomerId && !isEditMode
                        ? 'bg-muted  cursor-not-allowed'
                        : 'bg-card '
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-border dark:border-gray-600 rounded-lg bg-card  text-foreground text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-border dark:border-gray-600 rounded-lg bg-card  text-foreground text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Mobile <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    name="mobile"
                    value={formData.mobile}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-border dark:border-gray-600 rounded-lg bg-card  text-foreground text-sm"
                  />
                </div>
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
                  className="w-full px-3 py-2 border border-border dark:border-gray-600 rounded-lg bg-card  text-foreground text-sm"
                />
              </div>
            </div>

            {/* Airline-Specific Information */}
            <div className="space-y-4">
              <h4 className="font-semibold text-foreground flex items-center gap-2">
                <Globe size={18} />
                Airline Information
              </h4>

              <div className="grid grid-cols-1 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Title
                  </label>
                  <select
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-border dark:border-gray-600 rounded-lg bg-card  text-foreground text-sm"
                  >
                    <option value="">Select Title</option>
                    <option value="Mr">Mr</option>
                    <option value="Mrs">Mrs</option>
                    <option value="Ms">Ms</option>
                    <option value="Dr">Dr</option>
                    <option value="Prof">Prof</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Nationality
                  </label>
                  <input
                    type="text"
                    name="nationality"
                    value={formData.nationality}
                    onChange={handleChange}
                    placeholder="e.g., Indian, American"
                    className="w-full px-3 py-2 border border-border dark:border-gray-600 rounded-lg bg-card  text-foreground text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Preferred Language
                  </label>
                  <input
                    type="text"
                    name="preferredLanguage"
                    value={formData.preferredLanguage}
                    onChange={handleChange}
                    placeholder="e.g., English, Hindi"
                    className="w-full px-3 py-2 border border-border dark:border-gray-600 rounded-lg bg-card  text-foreground text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Frequent Flyer Number
                </label>
                <input
                  type="text"
                  name="frequentFlyerNumber"
                  value={formData.frequentFlyerNumber}
                  onChange={handleChange}
                  placeholder="FFN-XXXXXX"
                  className="w-full px-3 py-2 border border-border dark:border-gray-600 rounded-lg bg-card  text-foreground text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Agent Notes
                </label>
                <textarea
                  name="agentNotes"
                  value={formData.agentNotes}
                  onChange={handleChange}
                  rows="3"
                  placeholder="Internal notes for agents only..."
                  className="w-full px-3 py-2 border border-border dark:border-gray-600 rounded-lg bg-card  text-foreground text-sm resize-none"
                />
              </div>
            </div>

            {/* Personal Details */}
            <div className="space-y-4">
              <h4 className="font-semibold text-foreground flex items-center gap-2">
                <User size={18} />
                Personal Details
              </h4>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    name="dateOfBirth"
                    value={formData.dateOfBirth}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-border dark:border-gray-600 rounded-lg bg-card  text-foreground text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Gender
                  </label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-border dark:border-gray-600 rounded-lg bg-card  text-foreground text-sm"
                  >
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                    <option value="Prefer not to say">Prefer not to say</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Travel Document */}
            <div className="space-y-4">
              <h4 className="font-semibold text-foreground flex items-center gap-2">
                <FileText size={18} />
                Travel Document
              </h4>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Document Type
                  </label>
                  <select
                    name="travelDocument.documentType"
                    value={formData.travelDocument.documentType}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-border dark:border-gray-600 rounded-lg bg-card  text-foreground text-sm"
                  >
                    <option value="">Select Type</option>
                    <option value="Passport">Passport</option>
                    <option value="National ID">National ID</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Document Number
                  </label>
                  <input
                    type="text"
                    name="travelDocument.documentNumber"
                    value={formData.travelDocument.documentNumber}
                    onChange={handleChange}
                    placeholder="e.g., A12345678"
                    className="w-full px-3 py-2 border border-border dark:border-gray-600 rounded-lg bg-card  text-foreground text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Issuing Country
                  </label>
                  <input
                    type="text"
                    name="travelDocument.issuingCountry"
                    value={formData.travelDocument.issuingCountry}
                    onChange={handleChange}
                    placeholder="e.g., India"
                    className="w-full px-3 py-2 border border-border dark:border-gray-600 rounded-lg bg-card  text-foreground text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Issue Date
                  </label>
                  <input
                    type="date"
                    name="travelDocument.issueDate"
                    value={formData.travelDocument.issueDate}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-border dark:border-gray-600 rounded-lg bg-card  text-foreground text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Expiry Date
                  </label>
                  <input
                    type="date"
                    name="travelDocument.expiryDate"
                    value={formData.travelDocument.expiryDate}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-border dark:border-gray-600 rounded-lg bg-card  text-foreground text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Travel Preferences */}
            <div className="space-y-4">
              <h4 className="font-semibold text-foreground flex items-center gap-2">
                <Globe size={18} />
                Travel Preferences
              </h4>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Meal Preference
                  </label>
                  <select
                    name="travelPreferences.mealPreference"
                    value={formData.travelPreferences.mealPreference}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-border dark:border-gray-600 rounded-lg bg-card  text-foreground text-sm"
                  >
                    <option value="Regular">Regular</option>
                    <option value="Vegetarian">Vegetarian</option>
                    <option value="Vegan">Vegan</option>
                    <option value="Halal">Halal</option>
                    <option value="Kosher">Kosher</option>
                    <option value="Gluten-Free">Gluten-Free</option>
                    <option value="Diabetic">Diabetic</option>
                    <option value="Low-Calorie">Low-Calorie</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Seat Preference
                  </label>
                  <select
                    name="travelPreferences.seatPreference"
                    value={formData.travelPreferences.seatPreference}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-border dark:border-gray-600 rounded-lg bg-card  text-foreground text-sm"
                  >
                    <option value="No Preference">No Preference</option>
                    <option value="Window">Window</option>
                    <option value="Aisle">Aisle</option>
                    <option value="Middle">Middle</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Special Assistance
                </label>
                <input
                  type="text"
                  name="travelPreferences.specialAssistance"
                  value={formData.travelPreferences.specialAssistance}
                  onChange={handleChange}
                  placeholder="e.g., Wheelchair, Extra Legroom"
                  className="w-full px-3 py-2 border border-border dark:border-gray-600 rounded-lg bg-card  text-foreground text-sm"
                />
              </div>
            </div>

            {/* Emergency Contact */}
            <div className="space-y-4">
              <h4 className="font-semibold text-foreground flex items-center gap-2">
                <Phone size={18} />
                Emergency Contact
              </h4>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Contact Name
                  </label>
                  <input
                    type="text"
                    name="emergencyContact.name"
                    value={formData.emergencyContact.name}
                    onChange={handleChange}
                    placeholder="Full name"
                    className="w-full px-3 py-2 border border-border dark:border-gray-600 rounded-lg bg-card  text-foreground text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Relationship
                  </label>
                  <input
                    type="text"
                    name="emergencyContact.relationship"
                    value={formData.emergencyContact.relationship}
                    onChange={handleChange}
                    placeholder="e.g., Spouse, Parent"
                    className="w-full px-3 py-2 border border-border dark:border-gray-600 rounded-lg bg-card  text-foreground text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    name="emergencyContact.phone"
                    value={formData.emergencyContact.phone}
                    onChange={handleChange}
                    placeholder="+1 234 567 8900"
                    className="w-full px-3 py-2 border border-border dark:border-gray-600 rounded-lg bg-card  text-foreground text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    name="emergencyContact.email"
                    value={formData.emergencyContact.email}
                    onChange={handleChange}
                    placeholder="emergency@example.com"
                    className="w-full px-3 py-2 border border-border dark:border-gray-600 rounded-lg bg-card  text-foreground text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Address */}
            <div className="space-y-4">
              <h4 className="font-semibold text-foreground flex items-center gap-2">
                <MapPin size={18} />
                Address
              </h4>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Street / Building Address
                </label>
                <input
                  type="text"
                  name="address.street"
                  value={formData.address.street}
                  onChange={handleChange}
                  placeholder="House No., Street Name, Building"
                  className="w-full px-3 py-2 border border-border dark:border-gray-600 rounded-lg bg-card  text-foreground text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Country
                  </label>
                  <Select
                    value={selectedCountry}
                    onChange={handleCountryChange}
                    options={countries}
                    placeholder="Select Country"
                    isClearable
                    isSearchable
                    styles={selectStyles}
                    className="text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    State / Province
                  </label>
                  <Select
                    value={selectedState}
                    onChange={handleStateChange}
                    options={states}
                    placeholder={selectedCountry ? 'Select State' : 'Select Country First'}
                    isClearable
                    isSearchable
                    isDisabled={!selectedCountry}
                    styles={selectStyles}
                    className="text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    City
                  </label>
                  <Select
                    value={selectedCity}
                    onChange={handleCityChange}
                    options={cities}
                    placeholder={selectedState ? 'Select City' : 'Select State First'}
                    isClearable
                    isSearchable
                    isDisabled={!selectedState}
                    styles={selectStyles}
                    className="text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Postal / ZIP Code
                  </label>
                  <input
                    type="text"
                    name="address.postalCode"
                    value={formData.address.postalCode}
                    onChange={(e) => {
                      handleChange(e);
                      const isValid = validatePostalCode(e.target.value, selectedCountry?.isoCode);
                      if (e.target.value && !isValid) {
                        e.target.setCustomValidity(
                          'Invalid postal code format for selected country'
                        );
                      } else {
                        e.target.setCustomValidity('');
                      }
                    }}
                    placeholder={
                      selectedCountry?.isoCode === 'IN'
                        ? 'e.g., 110001'
                        : selectedCountry?.isoCode === 'US'
                        ? 'e.g., 10001'
                        : selectedCountry?.isoCode === 'GB'
                        ? 'e.g., SW1A 1AA'
                        : selectedCountry?.isoCode === 'CA'
                        ? 'e.g., K1A 0B1'
                        : 'Enter postal code'
                    }
                    className="w-full px-3 py-2 border border-border dark:border-gray-600 rounded-lg bg-card  text-foreground text-sm"
                  />
                  {selectedCountry?.isoCode === 'IN' && (
                    <p className="text-xs text-muted-foreground  mt-1">
                      6 digits (e.g., 110001)
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Locality / Area
                  </label>
                  <input
                    type="text"
                    name="address.locality"
                    value={formData.address.locality}
                    onChange={handleChange}
                    placeholder="Neighborhood, Area"
                    className="w-full px-3 py-2 border border-border dark:border-gray-600 rounded-lg bg-card  text-foreground text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Landmark
                  </label>
                  <input
                    type="text"
                    name="address.landmark"
                    value={formData.address.landmark}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-border dark:border-gray-600 rounded-lg bg-card  text-foreground text-sm"
                  />
                </div>
              </div>
            </div>
          </form>
        ) : activeTab === 'queries' ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold text-foreground flex items-center gap-2">
                <History size={18} />
                Query History
              </h4>
            </div>

            {isLoadingHistory ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
              </div>
            ) : queryHistory.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground ">
                No queries found for this customer
              </div>
            ) : (
              <div className="space-y-3">
                {queryHistory.map((query) => {
                  const statusBadge = getStatusBadge(query.status);
                  return (
                    <div
                      key={query._id}
                      className="p-4 border border-border  rounded-lg bg-card  hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-foreground">
                              {query.petitionId}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1 ${statusBadge.color}`}
                            >
                              {statusBadge.icon}
                              {query.status}
                            </span>
                          </div>
                          <div className="text-sm text-muted-foreground  space-y-1">
                            <div>
                              <strong>Subject:</strong> {query.subject || 'N/A'}
                            </div>
                            <div>
                              <strong>Category:</strong> {query.category} • {query.subcategory}
                            </div>
                            {query.description && (
                              <div className="mt-2 text-xs line-clamp-2">
                                <strong>Description:</strong> {query.description}
                              </div>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            const pathParts = window.location.pathname.split('/');
                            const baseUrl = `${window.location.origin}/${pathParts[1]}/${pathParts[2]}/${pathParts[3]}`;
                            window.open(`${baseUrl}/${query.petitionId || query._id}`, '_blank');
                          }}
                          className="ml-2 p-2 bg-primary  hover:bg-primary/5 dark:hover:bg-teal-950 rounded-lg transition-colors"
                          title="View Query"
                        >
                          <ExternalLink size={16} />
                        </button>
                      </div>

                      <div className="flex items-center justify-between text-xs text-muted-foreground  mt-2 pt-2 border-t border-border ">
                        <div>
                          Created: {format(new Date(query.createdAt), 'dd MMM yyyy, hh:mm a')}
                        </div>
                        {query.assignedTo && <div>Assigned: {query.assignedTo.name}</div>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : null}
      </div>

      {/* Footer */}
      {!isSearchMode &&
        (selectedCustomerId || isEditMode || queryCustomerInfo || isCreatingNew) && (
          <div className="px-4 py-3 border-t border-border  flex gap-2">
            {isEditMode || isCreatingNew || (!selectedCustomerId && !queryCustomerInfo) ? (
              <>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-teal-600 to-cyan-700 hover:from-teal-700 hover:to-cyan-800 text-white rounded-lg transition-all font-medium disabled:opacity-50"
                >
                  <Save size={18} />
                  {isSaving ? 'Saving...' : isEditMode ? 'Update Customer' : 'Create Customer'}
                </button>
                <button
                  onClick={() => {
                    if (isEditMode) {
                      setIsEditMode(false);
                    } else if (isCreatingNew) {
                      setIsCreatingNew(false);
                      resetForm();
                    } else {
                      onClose();
                    }
                  }}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </>
            ) : queryCustomerInfo ? (
              <>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-teal-600 to-cyan-700 hover:from-teal-700 hover:to-cyan-800 text-white rounded-lg transition-all font-medium disabled:opacity-50"
                >
                  <Save size={18} />
                  {isSaving
                    ? 'Saving...'
                    : customerId || selectedCustomerId
                    ? 'Update Customer'
                    : 'Create Customer'}
                </button>
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </>
            ) : (
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
              >
                Close
              </button>
            )}
          </div>
        )}
    </div>
  );
}

