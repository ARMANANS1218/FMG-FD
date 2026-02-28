import React, { useState } from 'react';
import { useUpdateQueryDetailsMutation } from '../../features/query/queryApi';

// ── Dropdowns ──────────────────────────────────────────────
const CONTACT_REASONS = [
    'Quality Issue', 'Damaged Product', 'Missing Item', 'Expired Product',
    'Allergy Concern', 'Packaging Issue', 'Refund Request', 'Replacement Request', 'General Inquiry',
];
const PURCHASE_CHANNELS = ['Tesco', "Sainsbury's", 'Amazon UK', 'Direct Website', 'Other'];
const PRODUCT_CATEGORIES = ['Food', 'Beverage', 'Personal Care', 'Household'];
const RESOLUTION_TYPES = ['Refund', 'Replacement', 'Voucher', 'Information Provided', 'Escalated'];
const ESCALATION_TARGETS = ['QA', 'Team Leader', 'Quality Team', 'Supply Chain', 'Legal'];
const SEVERITY_LEVELS = ['Low', 'Medium', 'High', 'Critical'];

// ── Reusable Field ─────────────────────────────────────────
const Field = ({ label, children }) => (
    <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</label>
        {children}
    </div>
);

const Input = ({ ...props }) => (
    <input
        {...props}
        className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
    />
);

const Select = ({ options = [], value, onChange, name }) => (
    <select
        name={name}
        value={value || ''}
        onChange={onChange}
        className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
    >
        <option value="">— Select —</option>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
    </select>
);

const Toggle = ({ label, name, checked, onChange }) => (
    <div className="flex items-center gap-2">
        <button
            type="button"
            onClick={() => onChange({ target: { name, type: 'checkbox', checked: !checked } })}
            className={`w-10 h-5 rounded-full transition-colors ${checked ? 'bg-blue-600' : 'bg-gray-200'} relative`}
        >
            <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-5' : ''}`} />
        </button>
        <span className="text-sm text-gray-700">{label}</span>
    </div>
);

// ── Panel Tabs ─────────────────────────────────────────────
const PANEL_TABS = [
    { key: 'product', label: '📦 Product Info' },
    { key: 'complaint', label: '⚠️ Complaint' },
    { key: 'interaction', label: '💬 Interaction' },
    { key: 'escalation', label: '🔺 Escalation' },
];

// ── Main Component ─────────────────────────────────────────
export default function FmcgQueryPanel({ query }) {
    const [panelTab, setPanelTab] = useState('product');
    const [form, setForm] = useState({
        productInfo: query?.productInfo || {},
        interactionMetrics: query?.interactionMetrics || {},
        escalationDetails: query?.escalationDetails || {},
        compliance: query?.compliance || {},
        severityLevel: query?.severityLevel || '',
        healthAndSafetyRisk: query?.healthAndSafetyRisk || false,
        regulatoryRiskFlag: query?.regulatoryRiskFlag || false,
        escalationRequired: query?.escalationRequired || false,
        refundAmount: query?.refundAmount || '',
    });
    const [saved, setSaved] = useState(false);
    const [updateQueryDetails, { isLoading }] = useUpdateQueryDetailsMutation();

    const handleNestedChange = (section, e) => {
        const { name, type, value, checked } = e.target;
        setForm((prev) => ({
            ...prev,
            [section]: { ...prev[section], [name]: type === 'checkbox' ? checked : value },
        }));
    };

    const handleTopChange = (e) => {
        const { name, type, value, checked } = e.target;
        setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };

    const handleSave = async () => {
        try {
            await updateQueryDetails({ petitionId: query.petitionId, ...form }).unwrap();
            setSaved(true);
            setTimeout(() => setSaved(false), 2500);
        } catch (err) {
            console.error('FMCG Panel save error:', err);
        }
    };

    if (!query) return null;

    return (
        <div className="border border-gray-100 rounded-2xl shadow-sm bg-gray-50 p-4 mt-4">
            <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                🇬🇧 FMCG Details
                <span className="ml-auto text-xs text-gray-400">Case: {query.petitionId}</span>
            </h3>

            {/* Panel Tabs */}
            <div className="flex gap-2 mb-4 flex-wrap">
                {PANEL_TABS.map((t) => (
                    <button
                        key={t.key}
                        onClick={() => setPanelTab(t.key)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${panelTab === t.key
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-white text-gray-600 border-gray-200 hover:border-blue-400'
                            }`}
                    >{t.label}</button>
                ))}
            </div>

            {/* ── Product Info ──────────────────────────────── */}
            {panelTab === 'product' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Field label="Product Name">
                        <Input name="productName" value={form.productInfo.productName || ''} onChange={(e) => handleNestedChange('productInfo', e)} placeholder="e.g. Oat Milk 1L" />
                    </Field>
                    <Field label="Brand">
                        <Input name="brand" value={form.productInfo.brand || ''} onChange={(e) => handleNestedChange('productInfo', e)} placeholder="Brand name" />
                    </Field>
                    <Field label="SKU Code">
                        <Input name="skuCode" value={form.productInfo.skuCode || ''} onChange={(e) => handleNestedChange('productInfo', e)} />
                    </Field>
                    <Field label="Batch / Lot Number">
                        <Input name="batchLotNumber" value={form.productInfo.batchLotNumber || ''} onChange={(e) => handleNestedChange('productInfo', e)} />
                    </Field>
                    <Field label="Expiry Date">
                        <Input type="date" name="expiryDate" value={form.productInfo.expiryDate?.split?.('T')[0] || ''} onChange={(e) => handleNestedChange('productInfo', e)} />
                    </Field>
                    <Field label="Manufacturing Date">
                        <Input type="date" name="manufacturingDate" value={form.productInfo.manufacturingDate?.split?.('T')[0] || ''} onChange={(e) => handleNestedChange('productInfo', e)} />
                    </Field>
                    <Field label="Purchase Date">
                        <Input type="date" name="purchaseDate" value={form.productInfo.purchaseDate?.split?.('T')[0] || ''} onChange={(e) => handleNestedChange('productInfo', e)} />
                    </Field>
                    <Field label="Purchase Channel">
                        <Select name="purchaseChannel" options={PURCHASE_CHANNELS} value={form.productInfo.purchaseChannel} onChange={(e) => handleNestedChange('productInfo', e)} />
                    </Field>
                    <Field label="Order Number">
                        <Input name="orderNumber" value={form.productInfo.orderNumber || ''} onChange={(e) => handleNestedChange('productInfo', e)} />
                    </Field>
                    <Field label="Store Location">
                        <Input name="storeLocation" value={form.productInfo.storeLocation || ''} onChange={(e) => handleNestedChange('productInfo', e)} />
                    </Field>
                    <Field label="Product Category">
                        <Select name="productCategory" options={PRODUCT_CATEGORIES} value={form.productInfo.productCategory} onChange={(e) => handleNestedChange('productInfo', e)} />
                    </Field>
                    <Field label="Qty Purchased">
                        <Input type="number" name="quantityPurchased" value={form.productInfo.quantityPurchased || ''} onChange={(e) => handleNestedChange('productInfo', e)} min="0" />
                    </Field>
                    <Field label="Qty Affected">
                        <Input type="number" name="quantityAffected" value={form.productInfo.quantityAffected || ''} onChange={(e) => handleNestedChange('productInfo', e)} min="0" />
                    </Field>
                </div>
            )}

            {/* ── Complaint Classification ──────────────────── */}
            {panelTab === 'complaint' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Field label="Contact Reason">
                        <Select name="category" options={CONTACT_REASONS} value={form.productInfo.contactReason} onChange={(e) => handleNestedChange('productInfo', e)} />
                    </Field>
                    <Field label="Complaint Sub-Category">
                        <Input name="subCategory" value={form.productInfo.subCategory || ''} onChange={(e) => handleNestedChange('productInfo', e)} />
                    </Field>
                    <Field label="Severity Level">
                        <Select name="severityLevel" options={SEVERITY_LEVELS} value={form.severityLevel} onChange={handleTopChange} />
                    </Field>
                    <div className="flex flex-col gap-3 pt-2">
                        <Toggle label="Health & Safety Risk" name="healthAndSafetyRisk" checked={form.healthAndSafetyRisk} onChange={handleTopChange} />
                        <Toggle label="Escalation Required" name="escalationRequired" checked={form.escalationRequired} onChange={handleTopChange} />
                        <Toggle label="Regulatory Risk (FSA)" name="regulatoryRiskFlag" checked={form.regulatoryRiskFlag} onChange={handleTopChange} />
                    </div>
                </div>
            )}

            {/* ── Interaction Fields ────────────────────────── */}
            {panelTab === 'interaction' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Field label="Resolution Type">
                        <Select name="resolutionType" options={RESOLUTION_TYPES} value={form.interactionMetrics.resolutionType} onChange={(e) => handleNestedChange('interactionMetrics', e)} />
                    </Field>
                    <Field label="Refund Amount (£ GBP)">
                        <Input type="number" name="refundAmount" value={form.refundAmount || ''} onChange={handleTopChange} min="0" step="0.01" placeholder="0.00" />
                    </Field>
                    <Field label="Compensation Type">
                        <Input name="compensationType" value={form.interactionMetrics.compensationType || ''} onChange={(e) => handleNestedChange('interactionMetrics', e)} placeholder="e.g. Voucher" />
                    </Field>
                    <div className="flex flex-col gap-3 pt-2">
                        <Toggle label="Courier Required" name="courierRequired" checked={form.interactionMetrics.courierRequired} onChange={(e) => handleNestedChange('interactionMetrics', e)} />
                        <Toggle label="Return Label Sent" name="returnLabelSent" checked={form.interactionMetrics.returnLabelSent} onChange={(e) => handleNestedChange('interactionMetrics', e)} />
                        <Toggle label="CSAT Sent" name="csatSent" checked={form.interactionMetrics.csatSent} onChange={(e) => handleNestedChange('interactionMetrics', e)} />
                    </div>
                </div>
            )}

            {/* ── Escalation Section ────────────────────────── */}
            {panelTab === 'escalation' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Field label="Escalated To">
                        <Select name="escalatedTo" options={ESCALATION_TARGETS} value={form.escalationDetails.escalatedTo} onChange={(e) => handleNestedChange('escalationDetails', e)} />
                    </Field>
                    <Field label="Root Cause Category">
                        <Input name="rootCauseCategory" value={form.escalationDetails.rootCauseCategory || ''} onChange={(e) => handleNestedChange('escalationDetails', e)} />
                    </Field>
                    <Field label="Corrective Action Taken">
                        <Input name="correctiveAction" value={form.escalationDetails.correctiveAction || ''} onChange={(e) => handleNestedChange('escalationDetails', e)} />
                    </Field>
                    <Field label="Linked Cases (Batch Mapping)">
                        <Input name="linkedCases" value={form.escalationDetails.linkedCases || ''} onChange={(e) => handleNestedChange('escalationDetails', e)} placeholder="Case IDs comma-separated" />
                    </Field>
                    <div className="flex flex-col gap-3 pt-2">
                        <Toggle label="FSA Notification Required" name="fsaNotificationRequired" checked={form.escalationDetails.fsaNotificationRequired} onChange={(e) => handleNestedChange('escalationDetails', e)} />
                    </div>
                    <Field label="GDPR — Data Deletion Request">
                        <Toggle label="Data Deletion Requested" name="dataDeletionRequest" checked={form.compliance.dataDeletionRequest} onChange={(e) => handleNestedChange('compliance', e)} />
                    </Field>
                    <Field label="GDPR — Subject Access Request">
                        <Toggle label="SAR Submitted" name="subjectAccessRequest" checked={form.compliance.subjectAccessRequest} onChange={(e) => handleNestedChange('compliance', e)} />
                    </Field>
                    <Field label="Refund Approval Auth ID">
                        <Input name="refundAuthId" value={form.compliance.refundAuthId || ''} onChange={(e) => handleNestedChange('compliance', e)} />
                    </Field>
                </div>
            )}

            {/* Save Button */}
            <div className="mt-5 flex items-center gap-3">
                <button
                    onClick={handleSave}
                    disabled={isLoading}
                    className="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition disabled:opacity-60"
                >
                    {isLoading ? 'Saving...' : '💾 Save FMCG Details'}
                </button>
                {saved && <span className="text-green-600 text-sm font-medium">✅ Saved successfully</span>}
            </div>
        </div>
    );
}
