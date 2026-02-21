import React, { useState, useEffect } from 'react';
import { useGetSuperAdminLocationAccessSettingsQuery, useToggleSuperAdminLocationAccessMutation } from '../../features/admin/adminApi';
import { toast } from 'react-toastify';
import { useSuperAdmin } from '../../context/SuperAdminContext';
import axios from 'axios';
import { API_URL } from '../../config/api';
import { 
  Building2, 
  MapPin, 
  ShieldCheck, 
  Settings2, 
  Save, 
  Info, 
  CheckCircle2, 
  Globe2, 
  Navigation,
  Users
} from 'lucide-react';

const SuperAdminLocationSettings = () => {
  const { getAuthHeaders } = useSuperAdmin();

  const [selectedOrgId, setSelectedOrgId] = useState('');
  const [organizations, setOrganizations] = useState([]);
  const [loadingOrgs, setLoadingOrgs] = useState(true);

  const { data: settingsData, isLoading: loadingSettings, refetch } = useGetSuperAdminLocationAccessSettingsQuery(
    selectedOrgId,
    { skip: !selectedOrgId }
  );
  const [toggleLocationAccess, { isLoading: toggling }] = useToggleSuperAdminLocationAccessMutation();

  const [enforce, setEnforce] = useState(false);
  const [radius, setRadius] = useState(100);
  const [selectedRoles, setSelectedRoles] = useState(['Admin', 'Agent', 'QA', 'TL']);

  const availableRoles = ['Admin', 'Agent', 'QA', 'TL'];

  // Fetch all organizations
  useEffect(() => {
    const fetchOrganizations = async () => {
      try {
        const response = await axios.get(
          `${API_URL}/api/v1/superadmin/organizations`,
          getAuthHeaders()
        );
        
        if (response.data.status) {
          const orgsData = response.data.data?.organizations || response.data.data || response.data.organizations || [];
          const orgsArray = Array.isArray(orgsData) ? orgsData : [];
          setOrganizations(orgsArray);
          
          if (orgsArray.length > 0) {
            setSelectedOrgId(orgsArray[0]._id);
          } else {
            toast.info('No organizations found in the system');
          }
        } else {
          setOrganizations([]);
          toast.error('Failed to load organizations');
        }
      } catch (error) {
        toast.error('Failed to load organizations');
        setOrganizations([]);
      } finally {
        setLoadingOrgs(false);
      }
    };

    fetchOrganizations();
  }, []);

  // Load settings when data is fetched
  useEffect(() => {
    if (settingsData?.data?.loginLocationAccess) {
      const settings = settingsData.data.loginLocationAccess;
      setEnforce(settings.enforce || false);
      setRadius(settings.defaultRadiusMeters || 100);
      setSelectedRoles(settings.roles || ['Admin', 'Agent', 'QA', 'TL']);
    }
  }, [settingsData]);

  const handleToggle = async () => {
    if (!selectedOrgId) {
      toast.error('Please select an organization');
      return;
    }

    const newEnforceValue = !enforce;
    
    try {
      const result = await toggleLocationAccess({
        orgId: selectedOrgId,
        enforce: newEnforceValue,
        defaultRadiusMeters: radius,
        roles: selectedRoles
      }).unwrap();

      toast.success(result.message || `Location access ${newEnforceValue ? 'enabled' : 'disabled'} successfully`);
      setEnforce(newEnforceValue);
      refetch();
    } catch (error) {
      console.error('Toggle location access error:', error);
      toast.error(error?.data?.message || 'Failed to update location access settings');
    }
  };

  const handleSaveSettings = async () => {
    if (!selectedOrgId) {
      toast.error('Please select an organization');
      return;
    }

    try {
      const result = await toggleLocationAccess({
        orgId: selectedOrgId,
        enforce,
        defaultRadiusMeters: radius,
        roles: selectedRoles
      }).unwrap();

      toast.success(result.message || 'Settings updated successfully');
      refetch();
    } catch (error) {
      console.error('Save settings error:', error);
      toast.error(error?.data?.message || 'Failed to save settings');
    }
  };

  const handleRoleToggle = (role) => {
    if (selectedRoles.includes(role)) {
      setSelectedRoles(selectedRoles.filter(r => r !== role));
    } else {
      setSelectedRoles([...selectedRoles, role]);
    }
  };

  if (loadingOrgs) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 w-full mx-auto min-h-screen space-y-6">
      
      {/* Organization Selector */}
      <div className="bg-card border border-border rounded-xl shadow-sm p-6 flex flex-col md:flex-row md:items-center gap-4">
        <div className="flex-1">
          <label className="text-sm font-medium text-muted-foreground mb-1 block">
             Target Organization
          </label>
          <div className="relative">
            <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
            <select
              value={selectedOrgId}
              onChange={(e) => setSelectedOrgId(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-muted/30 hover:bg-muted/50 border border-border rounded-xl text-foreground font-medium appearance-none cursor-pointer outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            >
              <option value="">Select Organization</option>
              {Array.isArray(organizations) && organizations.map((org) => (
                <option key={org._id} value={org._id}>
                  {org.name} ({org.organizationId})
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="md:w-px md:h-12 bg-border hidden md:block"></div>
        <div className="flex-1 md:flex-none">
          <div className="bg-primary/5 border border-primary/10 rounded-xl p-3 flex items-center gap-3">
             <div className="bg-primary/20 p-2 rounded-lg">
               <ShieldCheck className="w-5 h-5 text-foreground" />
             </div>
             <div>
               <p className="text-xs font-semibold text-foreground uppercase tracking-wide">Security Level</p>
               <p className="text-sm font-medium text-foreground">
                 {enforce ? 'Strict Enforcement' : 'Standard Access'}
               </p>
             </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main Settings Panel */}
        <div className="lg:col-span-2 space-y-6">
          {selectedOrgId && (
            <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden animate-in fade-in duration-300">
              <div className="p-6 border-b border-border bg-muted/20">
                <h2 className="text-lg font-semibold text-foreground flex items-center">
                  <Settings2 className="w-5 h-5 mr-2 text-foreground" />
                  Configuration
                </h2>
              </div>
              
              {loadingSettings ? (
                <div className="p-12 flex justify-center">
                   <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : (
                <div className="p-6 space-y-8">
                  
                  {/* Master Toggle */}
                  <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl border border-border">
                    <div>
                      <h3 className="text-base font-semibold text-foreground">Location-Based Access</h3>
                      <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                        Require employees to be physically present at approved office locations to log in.
                      </p>
                    </div>
                    <button
                      onClick={handleToggle}
                      disabled={toggling}
                      className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20 ${
                        enforce ? 'bg-primary' : 'bg-muted-foreground/30'
                      } ${toggling ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                      <span
                        className={`inline-block h-6 w-6 transform rounded-full bg-card transition-transform duration-200 ease-in-out ${
                          enforce ? 'translate-x-7' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  {enforce && (
                    <div className="space-y-8 animate-in slide-in-from-top-4 duration-300">
                      
                      {/* Radius Slider */}
                      <div>
                        <div className="flex justify-between items-center mb-4">
                          <label className="flex items-center text-sm font-medium text-foreground">
                            <Navigation className="w-4 h-4 mr-2 text-muted-foreground" />
                            Default Geofence Radius
                          </label>
                          <span className="text-2xl font-bold text-foreground font-mono bg-card px-3 py-1 rounded-lg">
                            {radius}m
                          </span>
                        </div>
                        <input
                          type="range"
                          min="10"
                          max="2000"
                          step="10"
                          value={radius}
                          onChange={(e) => setRadius(Number(e.target.value))}
                          className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                        />
                        <div className="flex justify-between mt-2 text-xs text-muted-foreground font-medium">
                          <span>10m (Tight)</span>
                          <span>2000m (Loose)</span>
                        </div>
                      </div>

                      {/* Roles Selection */}
                      <div>
                        <label className="flex items-center text-sm font-medium text-foreground mb-4">
                          <Users className="w-4 h-4 mr-2 text-muted-foreground" />
                          Enforced Roles
                        </label>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          {availableRoles.map((role) => {
                            const isSelected = selectedRoles.includes(role);
                            return (
                              <button
                                key={role}
                                onClick={() => handleRoleToggle(role)}
                                className={`
                                  relative overflow-hidden group p-3 rounded-xl border transition-all duration-200 text-left
                                  ${isSelected 
                                    ? 'border-primary bg-primary/5 ring-1 ring-primary/20' 
                                    : 'border-border bg-card hover:border-primary/50'
                                  }
                                `}
                              >
                                <div className="flex items-start justify-between mb-1">
                                  <span className={`font-semibold text-sm ${isSelected ? 'text-foreground' : 'text-foreground'}`}>
                                    {role}
                                  </span>
                                  <div className={`
                                    w-4 h-4 rounded-full border flex items-center justify-center transition-colors
                                    ${isSelected ? 'bg-primary border-primary' : 'border-muted-foreground'}
                                  `}>
                                    {isSelected && <CheckCircle2 className="w-3 h-3 text-white" />}
                                  </div>
                                </div>
                                <span className="text-[10px] text-muted-foreground block truncate">
                                  {role === 'Admin' ? 'Top level access' : 'Standard user'}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Action Bar */}
                      <div className="flex justify-end pt-4 border-t border-border">
                        <button
                          onClick={handleSaveSettings}
                          disabled={toggling}
                          className="
                            flex items-center px-6 py-2.5 rounded-xl font-medium text-sm
                            bg-primary hover:bg-primary/90 text-foreground-foreground
                            shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all
                            disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
                          "
                        >
                          {toggling ? (
                             <span className="flex items-center"><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div> Saving...</span>
                          ) : (
                             <span className="flex items-center"><Save className="w-4 h-4 mr-2" /> Save Configuration</span>
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Info Sidebar */}
        <div>
          <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden sticky top-6">
            <div className="p-6 bg-gradient-to-tr from-primary/10 via-primary/5 to-transparent border-b border-border">
              <h3 className="text-lg font-semibold text-foreground flex items-center mb-1">
                <Info className="w-5 h-5 mr-2" />
                How it works
              </h3>
              <p className="text-sm text-foreground/80">Understanding location enforcement</p>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="flex gap-4">
                <div className="mt-1">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-foreground text-sm">Security Compliance</h4>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    When enabled, users must grant browser location permission to access the platform.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="mt-1">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-foreground ">
                    <Globe2 className="w-5 h-5" />
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-foreground text-sm">Geofencing</h4>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    Access is only granted if the user is within the specified radius of an approved office coordinate.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="mt-1">
                  <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400">
                    <MapPin className="w-5 h-5" />
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-foreground text-sm">Organization Managed</h4>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    Actual office locations (lat/long) are managed by each organization's admin in their settings.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="p-4 bg-muted/30 border-t border-border text-center">
              <p className="text-xs text-muted-foreground italic">
                Changes apply immediately after saving.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminLocationSettings;
