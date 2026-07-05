"use client";

import type { WwftPayerData } from "@/lib/types";

interface WwftFormProps {
  value: WwftPayerData;
  onChange: (value: WwftPayerData) => void;
  disabled?: boolean;
}

export function WwftForm({ value, onChange, disabled }: WwftFormProps) {
  function update<K extends keyof WwftPayerData>(key: K, next: WwftPayerData[K]) {
    onChange({ ...value, [key]: next });
  }

  return (
    <div className="wwftForm">
      <div className="wwftHeader">
        <h4>WWFT identity verification</h4>
        <p>Required under Dutch AML law — all payer data is stored securely.</p>
      </div>

      <div className="wwftGrid">
        <label className="wwftField">
          <span>Full legal name</span>
          <input
            type="text"
            value={value.fullName}
            disabled={disabled}
            onChange={(e) => update("fullName", e.target.value)}
            placeholder="Jan de Vries"
          />
        </label>

        <label className="wwftField">
          <span>Date of birth</span>
          <input
            type="date"
            value={value.dateOfBirth}
            disabled={disabled}
            onChange={(e) => update("dateOfBirth", e.target.value)}
          />
        </label>

        <label className="wwftField">
          <span>Nationality</span>
          <input
            type="text"
            value={value.nationality}
            disabled={disabled}
            onChange={(e) => update("nationality", e.target.value)}
            placeholder="NL"
          />
        </label>

        <label className="wwftField">
          <span>Email</span>
          <input
            type="email"
            value={value.email}
            disabled={disabled}
            onChange={(e) => update("email", e.target.value)}
            placeholder="jan@example.com"
          />
        </label>

        <label className="wwftField">
          <span>Phone</span>
          <input
            type="tel"
            value={value.phone}
            disabled={disabled}
            onChange={(e) => update("phone", e.target.value)}
            placeholder="+31 6 12345678"
          />
        </label>

        <label className="wwftField">
          <span>ID document type</span>
          <select
            value={value.idDocumentType}
            disabled={disabled}
            onChange={(e) => update("idDocumentType", e.target.value)}
          >
            <option value="passport">Passport</option>
            <option value="id_card">National ID card</option>
            <option value="drivers_license">Driver&apos;s license</option>
          </select>
        </label>

        <label className="wwftField">
          <span>ID document number</span>
          <input
            type="text"
            value={value.idDocumentNumber}
            disabled={disabled}
            onChange={(e) => update("idDocumentNumber", e.target.value)}
            placeholder="Document number"
          />
        </label>

        <label className="wwftField wwftFieldWide">
          <span>Street address</span>
          <input
            type="text"
            value={value.addressStreet}
            disabled={disabled}
            onChange={(e) => update("addressStreet", e.target.value)}
            placeholder="Keizersgracht 123"
          />
        </label>

        <label className="wwftField">
          <span>City</span>
          <input
            type="text"
            value={value.addressCity}
            disabled={disabled}
            onChange={(e) => update("addressCity", e.target.value)}
            placeholder="Amsterdam"
          />
        </label>

        <label className="wwftField">
          <span>Postal code</span>
          <input
            type="text"
            value={value.addressPostalCode}
            disabled={disabled}
            onChange={(e) => update("addressPostalCode", e.target.value)}
            placeholder="1015 CJ"
          />
        </label>

        <label className="wwftField">
          <span>Country</span>
          <input
            type="text"
            value={value.addressCountry}
            disabled={disabled}
            onChange={(e) => update("addressCountry", e.target.value)}
            placeholder="NL"
          />
        </label>

        <label className="wwftField wwftFieldWide">
          <span>Payment purpose</span>
          <textarea
            value={value.paymentPurpose}
            disabled={disabled}
            onChange={(e) => update("paymentPurpose", e.target.value)}
            placeholder="Describe the reason for this USDT payment"
            rows={3}
          />
        </label>

        <label className="wwftField wwftFieldWide">
          <span>USDT network</span>
          <div className="chainToggle">
            <button
              type="button"
              className={`chainBtn ${value.chainType === 1 ? "chainBtnActive" : ""}`}
              disabled={disabled}
              onClick={() => update("chainType", 1)}
            >
              TRC20 (Tron)
            </button>
            <button
              type="button"
              className={`chainBtn ${value.chainType === 2 ? "chainBtnActive" : ""}`}
              disabled={disabled}
              onClick={() => update("chainType", 2)}
            >
              ERC20 (Ethereum)
            </button>
          </div>
        </label>
      </div>
    </div>
  );
}
