import type { DataType, EUCountry, Severity } from "@/types/incident";

export function calcSeverity(dataTypes: DataType[], affected: number | null): Severity {
  if (dataTypes.includes("Special Category Data") || dataTypes.includes("Health/Medical Records")) {
    return "high";
  }
  const sensitive = dataTypes.includes("Financial Data") || dataTypes.includes("Login Credentials") || dataTypes.includes("Biometric Data");
  if (sensitive && (affected ?? 0) > 100) return "medium";
  if (sensitive) return "medium";
  return "low";
}

export const AUTHORITY_BY_COUNTRY: Record<EUCountry, string> = {
  Germany: "BfDI (Bundesbeauftragte für den Datenschutz und die Informationsfreiheit)",
  France: "CNIL (Commission nationale de l'informatique et des libertés)",
  Italy: "Garante per la protezione dei dati personali",
  Spain: "AEPD (Agencia Española de Protección de Datos)",
  Netherlands: "Autoriteit Persoonsgegevens (AP)",
  Ireland: "Data Protection Commission (DPC)",
  Sweden: "Integritetsskyddsmyndigheten (IMY)",
  Poland: "Urząd Ochrony Danych Osobowych (UODO)",
  "Other EU": "Lead Supervisory Authority (to be determined)",
};

export function generateRefId(): string {
  const n = Math.floor(1000 + Math.random() * 9000);
  return `BR-2026-${n}`;
}
