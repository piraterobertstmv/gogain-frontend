import { useState, useRef, useEffect } from 'react';
import { Modal, Button, Form, Alert, Table, Spinner, ProgressBar } from 'react-bootstrap';
import * as XLSX from 'xlsx';
import * as pdfjsLib from 'pdfjs-dist';

// Simple function to check if a string is a valid MongoDB ObjectId format
const isValidObjectId = (id: string): boolean => {
  return /^[0-9a-fA-F]{24}$/.test(id);
};

// Set up PDF.js worker
try {
  console.log("Setting up PDF.js worker...");
  
  // Use a more reliable approach by bundling the worker with the application
  if (typeof window !== 'undefined' && 'Worker' in window) {
    // Create a worker URL using a blob
    const workerBlob = new Blob([
      `importScripts('https://cdn.jsdelivr.net/npm/pdfjs-dist@5.0.375/build/pdf.worker.min.js');`
    ], { type: 'application/javascript' });
    
    const workerUrl = URL.createObjectURL(workerBlob);
    pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;
    console.log("PDF.js worker set up successfully using blob URL");
  } else {
    console.warn("Web Workers are not supported in this environment");
  }
} catch (error) {
  console.error("Error setting up PDF.js worker:", error);
}

// Updated interface with more specific types to help Vercel build process
interface PdfTransactionImporterProps {
  show: boolean;
  onHide: () => void;
  onSuccess: () => void;
  data: {
    transaction?: any[];
    client?: any[];
    users?: any[];
    center?: any[];
    service?: any[];
    costs?: any[];
    [key: string]: any;
  };
  user: {
    _id: string;
    firstName: string;
    lastName: string;
    [key: string]: any;
  };
}

export function PdfTransactionImporter({ show, onHide, onSuccess, data, user }: PdfTransactionImporterProps) {
  const [file, setFile] = useState<File | null>(null);
  const [extractedText, setExtractedText] = useState<string[][]>([]);
  const [mappedData, setMappedData] = useState<any[]>([]);
  const [fieldMappings, setFieldMappings] = useState<Record<string, string | number>>({});
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [lastTransactionIndex, setLastTransactionIndex] = useState<number>(0);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Updated required fields to match exactly the table in the image
  const requiredFields = [
    { key: 'date', label: 'Date' },
    { key: 'center', label: 'Center' },
    { key: 'client', label: 'Client' },
    { key: 'costWithTaxes', label: 'Amount with taxes' },
    { key: 'cost', label: 'Amount without taxes' },
    { key: 'worker', label: 'Worker' },
    { key: 'taxes', label: 'Taxes' },
    { key: 'typeOfTransaction', label: 'Type of transaction' },
    { key: 'typeOfMovement', label: 'Type of movement' },
    { key: 'frequency', label: 'Frequency' },
    { key: 'typeOfClient', label: 'Type of client' },
    { key: 'service', label: 'Service' },
  ];
  
  // Remove the optional fields array since all fields are now in the required array
  // to match exactly the table structure
  const optionalFields: { key: string, label: string }[] = [];
  
  // Mappings from entity names to ObjectIDs
  const clientMappings: Record<string, string> = {
    "JORGE GOENAGA PEREZ": "67d814a15d16925ff8bd713c",
    "EPSILOG SARL": "67d814a15d16925ff8bd7158",
    "MACSF-ASSU-": "67d814a15d16925ff8bd715a",
    "MACSF-ASSU": "67d814a15d16925ff8bd715a",
    "C.A.R.P.I.M.K.O": "67d814a15d16925ff8bd715c",
    "ADIS": "67d814a15d16925ff8bd715e",
    "GC RE DOCTOLIB": "67d814a15d16925ff8bd7160",
    "Loan Payment": "67d814a15d16925ff8bd7162",
    "Matthieu Monnot": "67d814a15d16925ff8bd7164",
    "Free Pro": "67d814a15d16925ff8bd716c",
    "URSSAF D'ILE DE FRANCE": "67d814a15d16925ff8bd7170",
    "Jazz Pro Subscription Fee": "67d814a15d16925ff8bd7172",
    "SOGECAP": "67d814a15d16925ff8bd7174",
    "GIE AG2R REUNICA": "67d814a15d16925ff8bd7180",
    "ONEY BANQUE ACCORD": "67d814a15d16925ff8bd7182",
    "AXA / SOGAREP": "67d814a15d16925ff8bd7184",
    
    // New mappings for additional clients
    "Account Maintenance Fee": "67e814a15d16925ff8bd7190",
    "TPE Fixe IP + Pinpad": "67e814a15d16925ff8bd7191",
    "Debit Interest and Overdraft Fees": "67e814a15d16925ff8bd7192",
    "RITM LA FONTAINE": "67e814a15d16925ff8bd7193",
    "Mauro Navarro": "67e814a15d16925ff8bd7194",
    "Ana STEFANOVIC": "67e814a15d16925ff8bd7195",
    "Card Transaction (TRANSAVIA)": "67e814a15d16925ff8bd7196",
    "KARAPASS COURTAGE": "67e814a15d16925ff8bd7197",
    "SOFINCO AUTO MOTO LOISIRS": "67e814a15d16925ff8bd7198",
    "GIEPS-GIE DE PREVOYANCE SOCIALE": "67e814a15d16925ff8bd7199",
    "Quietis Pro Renewal (JAZZPRO-25%)": "67e814a15d16925ff8bd719a",
    "GG IMMOBILIER": "67e814a15d16925ff8bd719b",
    "DIAC SA": "67e814a15d16925ff8bd719c",
    
    // Card transactions 
    "Card Transaction (FRANPRIX 5055)": "67e814a15d16925ff8bd719d",
    "Card Transaction (FRANPRIX 5055": "67e814a15d16925ff8bd719d", // Same as above without closing parenthesis
    "Card Transaction (GARAGE ELITE 15)": "67e814a15d16925ff8bd719e",
    "Card Transaction (GAROUPE)": "67e814a15d16925ff8bd719f",
    "Card Transaction (HYPER GUERITE SANS)": "67e814a15d16925ff8bd71a0",
    "Card Transaction (CARREFOUR CITY)": "67e814a15d16925ff8bd71a1",
    "Card Transaction (MAGASINS NICOL*)": "67e814a15d16925ff8bd71a2",
    
    // Subscription and fee entries
    "Annual Card Collection Fee": "67e814a15d16925ff8bd71a3",
    "Visa Business Subscription Fee": "67e814a15d16925ff8bd71a4",
    
    // Direct ID mappings for specific e7... IDs in screenshot
    "e7d814a15d16925ff8bd713c": "JORGE GOENAGA PEREZ",
    "e7e814a15d16925ff8bd7190": "Account Maintenance Fee",
    "e7e814a15d16925ff8bd7191": "TPE Fixe IP + Pinpad",
    "e7e814a15d16925ff8bd7192": "Debit Interest and Overdraft Fees",
    "e7e814a15d16925ff8bd7193": "RITM LA FONTAINE",
    "e7e814a15d16925ff8bd7194": "Mauro Navarro",
    "e7e814a15d16925ff8bd7195": "Ana STEFANOVIC",
    "e7e814a15d16925ff8bd7196": "Card Transaction",
    "e7e814a15d16925ff8bd7197": "MUTUELLE Payment",
    "e7e814a15d16925ff8bd7198": "LEASING VOITURE Payment",
    "e7e814a15d16925ff8bd7199": "PREVOYANCE Payment",
    "e7e814a15d16925ff8bd719a": "FRAIS BANQUE Payment",
    "e7e814a15d16925ff8bd719b": "PERSONAL EXPENSE Payment",
    "e7e814a15d16925ff8bd719c": "LEASING VOITURE Fee"
  };
  
  const centerMappings: Record<string, string> = {
    "BOSQUET": "66eb4e85615c83d533d03876",
    "CASA PADEL 1": "66eb4e8d615c83d533d03879",
    "CASA PADEL 2": "66eb4e96615c83d533d0387b",
    "CASA PADEL 3": "66eb4e9b615c83d533d0387d",
    "CORPORATE": "66eb4ea1615c83d533d0387f",
    "APP": "66eb4ea7615c83d533d03881",
    "PSG": "66eb7ca21d57775184d73df5",
    "DIGITAL (GAIN ONE)": "66eb7cab1d57775184d73df8",
    "DIGITAL (GAIN PERFORMANCE)": "67421ed5c56bc42b28c7670a",
  };
  
  const serviceMappings: Record<string, string> = {
    "KINÉSITHERAPIE (30 Min)": "66eb4ec8615c83d533d03887",
    "OSTÉOPATHIE (Bosquet)": "66eb4ee0615c83d533d0388a",
    "OSTÉOPATHIE (Casa Padel 1,2 et 3)": "66eb4ef1615c83d533d0388c",
    "GAIN ONE (3 months)": "66eb4f0a615c83d533d03890",
    "HYATT COACHING": "66eb4f14615c83d533d03892",
    "APP START (TO B)": "66eb4f1b615c83d533d03894",
    "APP BOOST ( TO B)": "66eb4f20615c83d533d03896",
    "COACHING (45Min)": "67447edcb56b5793c0cda6db",
    "GAIN PERFORMANCE (3 mois)": "67447f0db56b5793c0cda70f",
    "GAIN PERFORMANCE (6mois)": "67447f37b56b5793c0cda743",
    "APP (TO C)": "67447fc9b56b5793c0cda791",
    "RÉTROCESSION": "674c7163b56b5793c0cdb733",
    "KINESITHERAPIE (30min)": "674dcfc1b56b5793c0cdc3ea",
    "KINESITHERAPIE A DOMICILE": "674dd029b56b5793c0cdc537",
    "GAIN ONE RENOV": "674dd24fb56b5793c0cdc701",
    "KINESITHERAPIE (60min)": "674ec700b56b5793c0cdd15b",
    
    // Ensure these have exact matches by providing multiple options for the same service
    "MASSE SALARIALE": "67d816374abe8436385a7acd",
    "Mass Salarial": "67d816374abe8436385a7acd",
    "MASSE SALARIALE (SALARIES)": "67d816374abe8436385a7acd",
    "SALAIRES": "67d816374abe8436385a7acd",
    "SALARIES": "67d816374abe8436385a7acd",
    "SALAIRE": "67d816374abe8436385a7acd",
    
    "FRAIS BANQUE": "67d816374abe8436385a7acf",
    "FRAIS BANCAIRES": "67d816374abe8436385a7acf",
    "BANK FEES": "67d816374abe8436385a7acf",
    "BANK CHARGES": "67d816374abe8436385a7acf",
    "BANKING FEES": "67d816374abe8436385a7acf",
    
    "TPE BANQUE": "67d816374abe8436385a7ad1",
    "TPE": "67d816374abe8436385a7ad1",
    "TPE FIXE": "67d816374abe8436385a7ad1",
    "TPE FEES": "67d816374abe8436385a7ad1",
    
    "LOYER CABINET": "67d816374abe8436385a7ad3",
    "LOYER": "67d816374abe8436385a7ad3",
    "RENT": "67d816374abe8436385a7ad3",
    "CABINET RENT": "67d816374abe8436385a7ad3",
    
    "PERSONAL EXPENSE": "67d816374abe8436385a7ad5",
    "EXPENSES": "67d816374abe8436385a7ad5",
    "DEPENSES PERSONNELLES": "67d816374abe8436385a7ad5",
    "FRAIS PERSONNELS": "67d816374abe8436385a7ad5",
    "PERSONAL": "67d816374abe8436385a7ad5",
    
    "MUTUELLE": "67d816374abe8436385a7ad7",
    "HEALTH INSURANCE": "67d816374abe8436385a7ad7",
    "ASSURANCE MALADIE": "67d816374abe8436385a7ad7",
    "HEALTH": "67d816374abe8436385a7ad7",
    
    "LEASING VOITURE": "67d816374abe8436385a7ad9",
    "LEASING": "67d816374abe8436385a7ad9",
    "CAR LEASING": "67d816374abe8436385a7ad9",
    "LOCATION VOITURE": "67d816374abe8436385a7ad9",
    "CAR RENTAL": "67d816374abe8436385a7ad9",
    
    "PREVOYANCE": "67d816374abe8436385a7adb",
    "DISABILITY INSURANCE": "67d816374abe8436385a7adb",
    "INSURANCE DISABILITY": "67d816374abe8436385a7adb",
    "PREVOYANCE SOCIALE": "67d816374abe8436385a7adb",
    
    "LOGICIEL CABINET": "67d816374abe8436385a7add",
    "LOGICIEL": "67d816374abe8436385a7add",
    "SOFTWARE": "67d816374abe8436385a7add",
    "CABINET SOFTWARE": "67d816374abe8436385a7add",
    
    "ASSURANCE": "67d816374abe8436385a7adf",
    "INSURANCE": "67d816374abe8436385a7adf",
    "ASSURANCE PRO": "67d816374abe8436385a7adf",
    "PROFESSIONAL INSURANCE": "67d816374abe8436385a7adf",
    
    "CHARGES SOCIALES": "67d816374abe8436385a7ae1",
    "SOCIAL CHARGES": "67d816374abe8436385a7ae1",
    "SOCIAL SECURITY": "67d816374abe8436385a7ae1",
    "COTISATIONS SOCIALES": "67d816374abe8436385a7ae1",
    
    "CREDIT CABINET": "67d816374abe8436385a7ae3",
    "CREDIT": "67d816374abe8436385a7ae3",
    "LOAN": "67d816374abe8436385a7ae3",
    "OFFICE CREDIT": "67d816374abe8436385a7ae3",
    "OFFICE LOAN": "67d816374abe8436385a7ae3",
    
    "INTERNET": "67d816374abe8436385a7ae5",
    "INTERNET SERVICE": "67d816374abe8436385a7ae5",
    "WEB": "67d816374abe8436385a7ae5",
    "ISP": "67d816374abe8436385a7ae5",
    
    "URSSAF/CHARGES SOCIALES": "67d816374abe8436385a7ae7",
    "URSSAF": "67d816374abe8436385a7ae7",
    "URSSAF CHARGES": "67d816374abe8436385a7ae7",
    "URSSAF COTISATIONS": "67d816374abe8436385a7ae7",
    
    "MUTUELLE SALARIÉ": "67d816374abe8436385a7ae9",
    "MUTUELLE SALARIAL": "67d816374abe8436385a7ae9",
    "EMPLOYEE HEALTH INSURANCE": "67d816374abe8436385a7ae9",
    "HEALTH INSURANCE EMPLOYEE": "67d816374abe8436385a7ae9",
  };
  
  
  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      if (selectedFile.type === 'application/pdf') {
        setFile(selectedFile);
        setError(null);
      } else {
        setError('Please select a PDF file');
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    }
  };
  
  // Handle Excel file upload directly
  const handleExcelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setIsLoading(true);
      setError(null);
      console.log("Processing Excel file:", file.name);
      
      const reader = new FileReader();
      
      reader.onload = (event) => {
        try {
          const data = event.target?.result;
          console.log("Excel file loaded, processing data...");
          
          // CRITICAL: Read exactly what's in Excel, no date manipulation
          const workbook = XLSX.read(data, { 
            type: 'binary',
            cellDates: false,  // Don't convert to JS Date objects
            cellText: true,    // Keep data as text
            raw: true,         // Don't interpret the data
            cellStyles: true,  // Read formatting information
            dateNF: 'dd/mm/yyyy' // Force date format to be European DD/MM/YYYY
          });
          console.log("Excel workbook read successfully");
          
          const sheetName = workbook.SheetNames[0];
          console.log("Using sheet:", sheetName);
          
          const worksheet = workbook.Sheets[sheetName];
          
          // Use sheet_to_json with header:1 to ensure we get arrays
          const excelData = XLSX.utils.sheet_to_json(worksheet, { 
            header: 1,
            raw: false,     // Keep formatted values exactly as shown in Excel
            defval: '',
            dateNF: 'dd/mm/yyyy'  // Force date format to European style
          }) as any[][];
          
          console.log("Raw Excel data sample:", excelData.slice(0, 2));
          
          // Add more debugging for date columns
          if (excelData.length > 1) {
            const headers = excelData[0];
            const firstRow = excelData[1];
            
            headers.forEach((header, idx) => {
              if (header && typeof header === 'string' && header.toLowerCase().includes('date')) {
                console.log(`Date column found: "${header}" - Value: "${firstRow[idx]}" (${typeof firstRow[idx]})`);
              }
            });
          }
          
          console.log("Excel data rows:", excelData.length);
          
          if (excelData.length < 2) {
            throw new Error('Excel file must contain at least a header row and one data row');
          }
          
          // Filter out empty rows (rows where all cells are empty or undefined)
          const filteredData = excelData.filter(row => 
            row.some(cell => cell !== undefined && cell !== null && cell !== '')
          );
          
          console.log("Filtered Excel data:", filteredData.length, "rows");
          
          // Use data directly with no modification
          setExtractedText(filteredData);
          
          // Set field mappings...
          const initialMappings: Record<string, string | number> = {};

          // Auto-map based on similar field names
          filteredData[0].forEach((header: string, index: number) => {
            if (!header) return;
            
            const headerLower = String(header).toLowerCase();
            
            // Check for each required and optional field
            [...requiredFields, ...optionalFields].forEach(field => {
              // Skip index field since we'll handle it automatically
              if (field.key === 'index') return;
              
              const fieldLower = field.label.toLowerCase();
              const fieldKeyLower = field.key.toLowerCase();
              
              // Special handling for service column - prioritize service matching
              if (field.key === 'service' && (
                  headerLower === 'service' ||
                  headerLower === 'services' ||
                  headerLower === 'service name' ||
                  headerLower === 'description' ||
                  headerLower.includes('service') ||
                  headerLower.includes('description')
              )) {
                initialMappings[field.key] = index;
                console.log(`Mapped service field to column "${header}" (${index})`);
                return;
              }
              
              // Exact match
              if (headerLower === fieldLower || headerLower === fieldKeyLower) {
                initialMappings[field.key] = index;
              }
              // Contains match (if no exact match was found)
              else if (!initialMappings[field.key] && 
                      (headerLower.includes(fieldLower) || 
                        fieldLower.includes(headerLower))) {
                initialMappings[field.key] = index;
              }
            });
          });

          // Set default worker to current user if not mapped
          if (!initialMappings['worker']) {
            initialMappings['worker'] = 'currentUser';
          }

          // Set default values for transaction type if not mapped
          if (!initialMappings['typeOfTransaction']) {
            initialMappings['typeOfTransaction'] = 'defaultRevenue';
          }
          
          console.log("Field mappings:", initialMappings);
          setFieldMappings(initialMappings);
          setStep(2); // CRITICAL: This sets the step to the mapping screen
        } catch (err: any) {
          console.error("Excel processing error:", err);
          setError(`Failed to process Excel file: ${err.message || 'Unknown error'}`);
        } finally {
          setIsLoading(false);
        }
      };
      
      reader.onerror = (event) => {
        console.error("FileReader error:", event);
        setError('Failed to read the Excel file');
        setIsLoading(false);
      };
      
      reader.readAsBinaryString(file);
    } else {
      console.warn("No Excel file selected");
    }
  };
  
  // Parse PDF file
  const parsePdf = async () => {
    if (!file) {
      setError('Please select a PDF file first');
      return;
    }
    
    try {
      setIsLoading(true);
      setProgress(0);
      setError(null);
      
      // Read the file as ArrayBuffer
      const fileData = await file.arrayBuffer();
      
      console.log("PDF file loaded, size:", fileData.byteLength);
      
      try {
        // Load the PDF document
        const loadingTask = pdfjsLib.getDocument({ data: fileData });
        
        // Add error handler to the loading task
        loadingTask.onProgress = (progressData: any) => {
          if (progressData.total > 0) {
            const percent = (progressData.loaded / progressData.total) * 100;
            setProgress(Math.round(percent));
          }
        };
        
        // Get total pages for progress calculation
        const pdfDocument = await loadingTask.promise;
        console.log("PDF document loaded, pages:", pdfDocument.numPages);
        
        const totalPages = pdfDocument.numPages;
        
        // Extract text from each page
        const textContent: string[] = [];
        
        for (let i = 1; i <= totalPages; i++) {
          try {
            const page = await pdfDocument.getPage(i);
            const content = await page.getTextContent();
            const pageText = content.items
              .map((item: any) => item.str)
              .join(' ');
            
            textContent.push(pageText);
            console.log(`Page ${i} extracted, text length:`, pageText.length);
            
            // Update progress
            setProgress(Math.round((i / totalPages) * 100));
          } catch (pageError: any) {
            console.error(`Error extracting page ${i}:`, pageError);
            textContent.push(`[Error extracting page ${i}: ${pageError.message}]`);
          }
        }
        
        // Process the extracted text
        processExtractedText(textContent.join('\n'));
      } catch (pdfError: any) {
        console.error("PDF.js error:", pdfError);
        
        // Fallback: Show error and provide alternative options
        setError(`PDF parsing failed: ${pdfError.message || 'Unknown error'}. Try using the Excel import option instead.`);
        
        // Create a simple fallback with raw text
        const decoder = new TextDecoder('utf-8');
        try {
          // Try to extract some text directly from the PDF
          const rawText = decoder.decode(fileData).replace(/[^\x20-\x7E\n]/g, '');
          // Split into rows and columns for table view
          const rows = rawText.split('\n').filter(line => line.trim().length > 0);
          const tableData = [['Raw Text'], ...rows.map(row => [row])];
          
          setExtractedText(tableData);
          
          // Set minimal field mappings for fallback
          setFieldMappings({
            'date': 0,
            'center': 0,
            'client': 0,
            'service': 0,
            'cost': 0,
            'worker': 'currentUser',
            'typeOfTransaction': 'defaultRevenue'
          });
          
          setStep(2);
          console.log("Using fallback raw text extraction");
        } catch (fallbackError) {
          console.error("Fallback extraction failed:", fallbackError);
        }
      }
    } catch (err: any) {
      console.error("PDF parsing error:", err);
      setError(`Failed to parse PDF: ${err.message || 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Process the extracted text into a tabular format
  const processExtractedText = (text: string) => {
    try {
      console.log("Processing extracted text, length:", text.length);
      
      // Split by lines
      const lines = text.split('\n').filter(line => line.trim().length > 0);
      console.log("Found lines:", lines.length);
      
      // Try multiple approaches to identify table structure
      let tableRows: string[][] = [];
      
      // Approach 1: Look for consistent patterns in the text
      // For example, if each transaction is on a separate line with consistent spacing
      console.log("Trying pattern-based extraction...");
      
      // Simple heuristic: Split by whitespace and try to identify rows with consistent column count
      const potentialRows = lines.map(line => line.split(/\s{2,}/).map(cell => cell.trim()));
      
      // Find the most common column count
      const columnCounts = potentialRows.map(row => row.length);
      console.log("Column counts distribution:", columnCounts);
      
      const mostCommonColumnCount = findMostCommonValue(columnCounts);
      console.log("Most common column count:", mostCommonColumnCount);
      
      // Filter rows that have the most common column count
      const filteredRows = potentialRows.filter(row => row.length === mostCommonColumnCount);
      console.log("Filtered rows with consistent columns:", filteredRows.length);
      
      // If we have enough rows, assume the first one is headers
      if (filteredRows.length > 1) {
        tableRows = filteredRows;
        console.log("Using pattern-based extraction");
      } 
      // Approach 2: Try to split by fixed character positions
      else if (lines.length > 1) {
        console.log("Trying position-based extraction...");
        
        // Look for patterns in the first few lines to identify column positions
        const sampleLines = lines.slice(0, Math.min(10, lines.length));
        
        // Find potential column boundaries by looking for spaces in the same positions
        const positions: number[] = [];
        const firstLine = sampleLines[0];
        
        // Find spaces in the first line
        for (let i = 0; i < firstLine.length; i++) {
          if (firstLine[i] === ' ' && firstLine[i+1] === ' ') {
            let isColumnBoundary = true;
            
            // Check if this position is a space in most lines
            for (let j = 1; j < sampleLines.length; j++) {
              if (i >= sampleLines[j].length || sampleLines[j][i] !== ' ') {
                isColumnBoundary = false;
                break;
              }
            }
            
            if (isColumnBoundary) {
              positions.push(i);
            }
          }
        }
        
        console.log("Potential column positions:", positions);
        
        // If we found potential column positions, split the lines by these positions
        if (positions.length > 0) {
          tableRows = lines.map(line => {
            const cells: string[] = [];
            let start = 0;
            
            for (const pos of positions) {
              if (pos > start) {
                cells.push(line.substring(start, pos).trim());
                start = pos + 1;
              }
            }
            
            // Add the last cell
            if (start < line.length) {
              cells.push(line.substring(start).trim());
            }
            
            return cells;
          });
          
          console.log("Using position-based extraction");
        }
        // Approach 3: Simple line splitting
        else {
          console.log("Using simple line splitting...");
          
          // Just split each line by spaces, but try to be smart about it
          tableRows = lines.map(line => {
            // Replace multiple spaces with a single space
            const normalizedLine = line.replace(/\s{2,}/g, ' ');
            // Split by space
            return normalizedLine.split(' ').filter(cell => cell.trim().length > 0);
          });
          
          console.log("Using simple line splitting");
        }
      } else {
        throw new Error('Could not automatically detect table structure. The PDF may not contain tabular data or the format is not supported.');
      }
      
      console.log("Final table structure:", tableRows.length, "rows");
      
      if (tableRows.length === 0) {
        throw new Error('No tabular data could be extracted from the PDF.');
      }
      
      setExtractedText(tableRows);
      
      // Convert to objects with header keys
      const headers = tableRows[0];
      const dataRows = tableRows.slice(1);
      
      console.log("Headers:", headers);
      console.log("Data rows:", dataRows.length);
      
      // Set field mappings
      const initialMappings: Record<string, string | number> = {};

      // Auto-map based on similar field names
      headers.forEach((header: string, index: number) => {
        if (!header) return;
        
        const headerLower = String(header).toLowerCase();
        
        // Check for each required and optional field
        [...requiredFields, ...optionalFields].forEach(field => {
          // Skip index field since we'll handle it automatically
          if (field.key === 'index') return;
          
          const fieldLower = field.label.toLowerCase();
          
          // Exact match
          if (headerLower === fieldLower || headerLower === field.key.toLowerCase()) {
            initialMappings[field.key] = index;
          }
          // Contains match (if no exact match was found)
          else if (!initialMappings[field.key] && 
                  (headerLower.includes(fieldLower) || 
                    fieldLower.includes(headerLower))) {
            initialMappings[field.key] = index;
          }
        });
      });

      // Set default worker to current user if not mapped
      if (!initialMappings['worker']) {
        initialMappings['worker'] = 'currentUser';
      }

      // Set default values for transaction type if not mapped
      if (!initialMappings['typeOfTransaction']) {
        initialMappings['typeOfTransaction'] = 'defaultRevenue';
      }

      setFieldMappings(initialMappings);
      setStep(2); // CRITICAL: Set step to mapping screen
      
    } catch (err: any) {
      console.error("Text processing error:", err);
      setError(`Failed to process PDF content: ${err.message || 'Unknown error'}`);
      
      // Even if we failed to process automatically, allow the user to export the raw text
      if (text.length > 0) {
        const fallbackRows = [['Raw Text'], [text]];
        setExtractedText(fallbackRows);
        setStep(2);
      }
    }
  };
  
  // Find the most common value in an array
  const findMostCommonValue = (arr: number[]): number => {
    const counts = arr.reduce((acc: Record<number, number>, val) => {
      acc[val] = (acc[val] || 0) + 1;
      return acc;
    }, {});
    
    return Number(Object.entries(counts).reduce((a, b) => a[1] > b[1] ? a : b)[0]);
  };
  
  // Update field mapping
  const updateFieldMapping = (fieldKey: string, columnIndex: string | number) => {
    setFieldMappings(prev => ({
      ...prev,
      [fieldKey]: columnIndex
    }));
  };
  
  // Process mappings and prepare data
  const processMapping = () => {
    if (Object.keys(fieldMappings).length === 0) {
      setError('Please map at least one field before proceeding');
        return;
      }
      
    try {
      setIsLoading(true);
      setProgress(50);
      
      // Skip header row (index 0)
      const dataRows = extractedText.slice(1);
      const mappedRows = [];
      
      for (const row of dataRows) {
        if (!row || row.length === 0) continue;
        
        const mappedRow: Record<string, any> = {};
        
        // Process each field mapping
        for (const [field, columnIndex] of Object.entries(fieldMappings)) {
          // Skip fields that end with _manual as they're handled separately
          if (field.endsWith('_manual')) continue;
          
          if (columnIndex === 'manual') {
            // For manual selection, use the _manual value
            const manualValue = fieldMappings[`${field}_manual`];
            if (manualValue) {
              mappedRow[field] = manualValue;
            }
          } else if (typeof columnIndex === 'number' || !isNaN(Number(columnIndex))) {
            // For regular column mappings
            const idx = Number(columnIndex);
            if (row[idx] !== undefined) {
              mappedRow[field] = row[idx];
            }
          }
        }
        
        mappedRows.push(mappedRow);
      }
      
      console.log('Mapped data:', mappedRows);
      setMappedData(mappedRows);
      setStep(3); // Move to validation/review step
    } catch (error) {
      console.error('Error mapping data:', error);
      setError('Error processing the data. Please check your mapping.');
    } finally {
      setIsLoading(false);
      setProgress(70);
    }
  };
  
  // Prepare and validate transaction data
  const prepareTransactionData = () => {
    // Create a client lookup function to find client ID by name
    const findClientId = (clientName: string): string | null => {
      if (!clientName) return null;
      
      // Direct lookup in clientMappings
      const mappedClient = clientMappings[clientName];
      if (mappedClient) {
        return mappedClient;
      }
      
      // Try to find in data.client array
      const client = data.client?.find((c: any) => 
        `${c.firstName} ${c.lastName}`.toLowerCase() === clientName.toLowerCase() ||
        c.name?.toLowerCase() === clientName.toLowerCase()
      );
      
      return client?._id || null;
    };
    
    // Create a center lookup function
    const findCenterId = (centerName: string): string | null => {
      if (!centerName) return null;
      
      // Direct lookup in centerMappings
      const mappedCenter = centerMappings[centerName];
      if (mappedCenter) {
        return mappedCenter;
      }
      
      // Try to find in data.center array
      const center = data.center?.find((c: any) => 
        c.name?.toLowerCase() === centerName.toLowerCase()
      );
      
      return center?._id || null;
    };
    
    // Create a service lookup function
    const findServiceId = (serviceName: string): string | null => {
      if (!serviceName) return null;
      
      // If it's already an ID (from manual selection), return it
      if (isValidObjectId(serviceName)) {
        return serviceName;
      }
      
      // Direct lookup in serviceMappings
      const mappedService = serviceMappings[serviceName];
      if (mappedService) {
        return mappedService;
      }
      
      // Try to find in data.service array
      const service = data.service?.find((s: any) => 
        s.name?.toLowerCase() === serviceName.toLowerCase()
      );
      
      return service?._id || null;
    };
    
    // Transform the mapped data into transaction objects
    return mappedData.map((row, index) => {
      try {
        // Extract values with default handling
        const date = row.date || new Date().toISOString().split('T')[0];
        const clientInput = row.client || '';
        const centerInput = row.center || '';
        const serviceInput = row.service || '';
        
        // Look up IDs or use existing IDs
        const clientId = isValidObjectId(clientInput) ? clientInput : findClientId(clientInput);
        const centerId = isValidObjectId(centerInput) ? centerInput : findCenterId(centerInput);
        const serviceId = isValidObjectId(serviceInput) ? serviceInput : findServiceId(serviceInput);
        
        // Get cost from the row data (if available) or default to 0
        let cost = 0;
        if (row.costWithTaxes) {
          cost = parseFloat(String(row.costWithTaxes)) || 0;
        } else if (row.cost) {
          cost = parseFloat(String(row.cost)) || 0;
        }
        
        // Get taxes from the row data or default to 0
        let taxes = parseFloat(String(row.taxes || 0));
        
        // Start building the transaction
        const transaction: Record<string, any> = {
          date: date,
          // Set the worker to the current user if not specified
          worker: row.worker || user._id,
          cost: cost,
          taxes: taxes,
          typeOfTransaction: row.typeOfTransaction || 'income',
          typeOfMovement: row.typeOfMovement || 'unique',
          frequency: row.frequency || 'daily',
          typeOfClient: row.typeOfClient || 'professional',
          index: lastTransactionIndex + index + 1 // Start from the last transaction index + 1
        };
        
        // Add client details
        if (clientId) {
          transaction.client = clientId;
          // Store original client name for display purposes
          if (clientInput && typeof clientInput === 'string') {
            transaction.originalClientName = clientInput;
          }
        } else if (clientInput) {
          transaction.originalClientName = clientInput;
        }
        
        // Add center details
        if (centerId) {
          transaction.center = centerId;
          if (centerInput && typeof centerInput === 'string') {
            transaction.originalCenterName = centerInput;
          }
        } else if (centerInput) {
          transaction.originalCenterName = centerInput;
        }
        
        // Add service details
        if (serviceId) {
          transaction.service = serviceId;
          if (serviceInput && typeof serviceInput === 'string') {
            transaction.originalServiceName = serviceInput;
          }
          
          // Only use the service's default cost if the transaction doesn't have one
          if (cost === 0 && serviceId) {
            const serviceObj = data.service?.find((s: any) => s._id === serviceId);
            if (serviceObj && serviceObj.cost) {
              transaction.cost = parseFloat(String(serviceObj.cost)) || 0;
            }
            
            if (serviceObj && serviceObj.tax && taxes === 0) {
              transaction.taxes = parseFloat(String(serviceObj.tax)) || 0;
            }
          }
        } else if (serviceInput) {
          transaction.originalServiceName = serviceInput;
        }
        
        console.log(`Prepared transaction ${index}:`, transaction);
      return transaction;
      } catch (error) {
        console.error(`Error preparing transaction ${index}:`, error);
        return null;
      }
    }).filter(Boolean); // Remove any null entries
  };
  
  // Helper function for field selector rendering
  const renderFieldSelector = () => {
    return (
      <>
        <option value="">-- Select Column --</option>
        {extractedText[0]?.map((header, index) => (
          <option key={index} value={index}>{header}</option>
        ))}
      </>
    );
  };
  
  const renderReviewStep = () => {
    const preparedTransactions = prepareTransactionData();
    
    // Calculate totals - safely handle null transactions
    const totalAmount = preparedTransactions
      .filter((transaction): transaction is Record<string, any> => transaction !== null)
      .reduce((sum, transaction) => sum + (parseFloat(String(transaction.cost)) || 0), 0)
      .toFixed(2);
    
    const getClientDisplayName = (transaction: any): string => {
      if (transaction.client && transaction.originalClientName) {
        // Try to find client name in data
        const client = data.client?.find((c: any) => c._id === transaction.client);
        if (client) {
          return `${client.firstName} ${client.lastName}`;
        }
        // If we can't find the client in data, use the original name from input
        return transaction.originalClientName;
      } else if (transaction.client) {
        const client = data.client?.find((c: any) => c._id === transaction.client);
        return client ? `${client.firstName} ${client.lastName}` : `ID: ${transaction.client}`;
      } else if (transaction.originalClientName) {
        return transaction.originalClientName;
      }
      return 'No Client';
    };
    
    const getCenterDisplayName = (transaction: any): string => {
      if (transaction.center && transaction.originalCenterName) {
        const center = data.center?.find((c: any) => c._id === transaction.center);
        if (center) {
          return center.name;
        }
        return transaction.originalCenterName;
      } else if (transaction.center) {
        const center = data.center?.find((c: any) => c._id === transaction.center);
        return center ? center.name : `ID: ${transaction.center}`;
      } else if (transaction.originalCenterName) {
        return transaction.originalCenterName;
      }
      return 'No Center';
    };
    
    const getServiceDisplayName = (transaction: any): string => {
      if (transaction.service && transaction.originalServiceName) {
        const service = data.service?.find((s: any) => s._id === transaction.service);
        if (service) {
          return service.name;
        }
        // Use original service name if we can't find the service in data
        return transaction.originalServiceName;
      } else if (transaction.service) {
        const service = data.service?.find((s: any) => s._id === transaction.service);
        return service ? service.name : `ID: ${transaction.service}`;
      } else if (transaction.originalServiceName) {
        return transaction.originalServiceName;
      }
      return 'No Service';
    };
    
    // Add a function to properly format the date for display
    const formatDate = (dateStr: string): string => {
      if (!dateStr) return 'No Date';
      
      try {
        // If it's already an ISO date, format it nicely
        if (dateStr.includes('-')) {
          const date = new Date(dateStr);
          if (!isNaN(date.getTime())) {
            return date.toLocaleDateString();
          }
        }
        // Otherwise just return as is
        return dateStr;
      } catch (e) {
        return dateStr;
      }
    };
    
    // Group transactions by service for better review
    const serviceGroups: Record<string, any[]> = {};
    preparedTransactions
      .filter((transaction): transaction is Record<string, any> => transaction !== null)
      .forEach(transaction => {
        const serviceKey = transaction.service || 'unassigned';
        if (!serviceGroups[serviceKey]) {
          serviceGroups[serviceKey] = [];
        }
        serviceGroups[serviceKey].push(transaction);
      });
    
    return (
      <div className="mt-4">
        <h4>Review Transactions ({preparedTransactions.length})</h4>
        <p>Total Amount: €{totalAmount}</p>
        
        <Table striped bordered hover size="sm" responsive>
            <thead>
              <tr>
              <th>Index</th>
              <th>Date</th>
              <th>Client</th>
              <th>Center</th>
              <th>Service</th>
              <th>Amount</th>
              <th>Type</th>
              </tr>
            </thead>
            <tbody>
            {preparedTransactions
              .filter((transaction): transaction is Record<string, any> => transaction !== null)
              .map((transaction, index) => (
                <tr key={index}>
                  <td>{transaction.index}</td>
                  <td>{formatDate(transaction.date)}</td>
                  <td>{getClientDisplayName(transaction)}</td>
                  <td>{getCenterDisplayName(transaction)}</td>
                  <td>{getServiceDisplayName(transaction)}</td>
                  <td>€{parseFloat(String(transaction.cost)).toFixed(2)}</td>
                  <td>{transaction.typeOfTransaction}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        
        <div className="d-flex justify-content-between mt-3">
          <Button variant="secondary" onClick={() => setStep(2)}>
            Back to Mapping
          </Button>
          <div>
            <Button 
              variant="primary" 
              onClick={handleSubmit} 
              disabled={isLoading || preparedTransactions.length === 0}
              className="me-2"
            >
              {isLoading ? (
                <>
                  <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />
                  <span className="ms-2">Importing...</span>
                </>
              ) : (
                'Import Transactions'
              )}
            </Button>
            <Button 
              variant="outline-secondary" 
              onClick={exportToExcel} 
              disabled={preparedTransactions.length === 0}
            >
              Export to Excel
            </Button>
          </div>
        </div>
      </div>
    );
  };
  
  const handleSubmit = async () => {
    if (step !== 3) {
      console.error("Submit called when not on review step");
      return;
    }
    
      setIsLoading(true);
    setProgress(0);
      setError(null);
      
    try {
      // Final validation of transactions
      const preparedTransactions = prepareTransactionData();
      const finalValidTransactions = preparedTransactions.filter((transaction: any) => {
        // Ensure required fields are present
        return transaction.date && (transaction.client || transaction.originalClientName) && 
              (transaction.center || transaction.originalCenterName) && 
              (transaction.service || transaction.originalServiceName);
      });
      
      if (finalValidTransactions.length === 0) {
        setError("No valid transactions to submit. Please check your data and try again.");
        setIsLoading(false);
        return;
      }
      
      console.log("Submitting transactions to API:", finalValidTransactions.length);
      
      // Use environment variable for API URL instead of localhost
              const apiUrl = import.meta.env.VITE_API_URL || 'https://gogain-backend.onrender.com/';
      
      const response = await fetch(`${apiUrl}transactions/batch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({ transactions: finalValidTransactions })
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        setError(`API Error: ${errorData.message || response.statusText}`);
        setIsLoading(false);
        return;
      }
      
      const result = await response.json();
      
      console.log("API Response:", result);
      
      setSuccess(`Successfully imported ${result.insertedCount || finalValidTransactions.length} transactions.`);
      setIsLoading(false);
      
      // Call onSuccess handler to refresh the main view
      setTimeout(() => {
        onSuccess();
        onHide();
      }, 2000);
    } catch (error: any) {
      console.error("Error submitting transactions:", error);
      setError(`Error: ${error.message || "Unknown error occurred"}`);
      setIsLoading(false);
    }
  };
  
  const exportToExcel = () => {
    try {
      // Create a new workbook
      const wb = XLSX.utils.book_new();
      
      // Convert mapped data to a format suitable for Excel - match exactly the transaction table format
      const excelData = mappedData.map((transaction: any) => {
        return {
          'Index': transaction.index,
          'Date': transaction.originalDateFormat || transaction.date,
          'Center': transaction.originalCenterName || transaction.center,
          'Client': transaction.originalClientName || transaction.client,
          'Amount with taxes': transaction.costWithTaxes || transaction.cost,
          'Amount without taxes': transaction.cost,
          'Worker': transaction.originalWorkerName || transaction.worker,
          'Taxes': transaction.taxes || '0%',
          'Type of transaction': transaction.typeOfTransaction || 'revenue',
          'Type of movement': transaction.typeOfMovement || 'bank transfer',
          'Frequency': transaction.frequency || 'ordinary',
          'Type of client': transaction.typeOfClient || 'client',
          'Service': transaction.originalServiceName || transaction.service
        };
      });
      
      // Create a worksheet
      const ws = XLSX.utils.json_to_sheet(excelData);
      
      // Add the worksheet to the workbook
      XLSX.utils.book_append_sheet(wb, ws, "Transactions");
      
      // Generate a download
      XLSX.writeFile(wb, "transactions_preview.xlsx");
      
      setSuccess("Exported transactions to Excel successfully.");
    } catch (error: any) {
      console.error("Error exporting to Excel:", error);
      setError(`Error exporting to Excel: ${error.message}`);
    }
  };
  
  // Reset the component state - Used when reopening the modal
  const resetState = () => {
    setFile(null);
    setExtractedText([]);
    setMappedData([]);
    setFieldMappings({});
    setStep(1);
    setProgress(0);
    setError(null);
    setSuccess(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  // Use resetState when component is shown and fetch last transaction index
  useEffect(() => {
    if (show) {
      resetState();
      fetchLastTransactionIndex();
    }
  }, [show]);
  
  // Fetch the last transaction index from the API
  const fetchLastTransactionIndex = async () => {
    try {
      // Use environment variable for API URL instead of localhost
              const apiUrl = import.meta.env.VITE_API_URL || 'https://gogain-backend.onrender.com/';
      
      // First try to get the last index from the API
      const response = await fetch(`${apiUrl}transactions/last-index`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log("Fetched last transaction index from API:", data.lastIndex);
        setLastTransactionIndex(data.lastIndex || 0);
      } else {
        console.warn("Failed to fetch last transaction index from API, falling back to local data");
        
        // Fallback: Calculate from the local data
        const maxIndex = data.transaction?.reduce((max: number, t: any) => {
          const index = parseInt(t.index);
          return isNaN(index) ? max : Math.max(max, index);
        }, 0) || 0;
        
        console.log("Calculated last transaction index from local data:", maxIndex);
        setLastTransactionIndex(maxIndex);
      }
    } catch (error) {
      console.error("Error fetching last transaction index:", error);
      
      // Fallback: Calculate from the local data
      const maxIndex = data.transaction?.reduce((max: number, t: any) => {
        const index = parseInt(t.index);
        return isNaN(index) ? max : Math.max(max, index);
      }, 0) || 0;
      
      console.log("Calculated last transaction index from local data due to error:", maxIndex);
      setLastTransactionIndex(maxIndex);
    }
  };
  
  return (
    <Modal show={show} onHide={onHide} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Import Transactions from PDF</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {step === 1 && (
          <>
            <Alert variant="info">
              <p>Upload a PDF file containing your transaction data.</p>
              <p>The system will attempt to extract tabular data from the PDF.</p>
              <p><strong>Note:</strong> PDF extraction works best with well-structured documents. For best results:</p>
              <ul>
                <li>Use PDFs with clear tabular data</li>
                <li>Ensure the PDF has consistent column spacing</li>
                <li>Text-based PDFs work better than scanned documents</li>
              </ul>
            </Alert>
            
            <Form.Group className="mb-3">
              <Form.Label>Select PDF File</Form.Label>
              <Form.Control 
                type="file" 
                onChange={handleFileChange}
                onClick={(e) => {
                  // Reset value when clicking to ensure onChange fires even if selecting the same file
                  (e.target as HTMLInputElement).value = '';
                }}
                accept=".pdf"
                ref={fileInputRef}
              />
              <Form.Text className="text-muted">
                Maximum file size: 10MB
              </Form.Text>
            </Form.Group>
            
            <hr className="my-4" />
            
            <Alert variant="secondary">
              <p><strong>Alternative:</strong> If you have your data in Excel format, you can upload it directly:</p>
            </Alert>
            
            <Form.Group className="mb-3">
              <Form.Label>Or Upload Excel File</Form.Label>
              <Form.Control 
                type="file" 
                onChange={handleExcelUpload}
                onClick={(e) => {
                  // Reset value when clicking to ensure onChange fires even if selecting the same file
                  (e.target as HTMLInputElement).value = '';
                }}
                accept=".xlsx,.xls,.csv"
              />
              <Form.Text className="text-muted">
                Upload Excel (.xlsx, .xls) or CSV files
              </Form.Text>
            </Form.Group>
            
            {isLoading && (
              <div className="mt-3">
                <p>Processing file... This may take a moment.</p>
                <ProgressBar now={progress} label={`${progress}%`} />
              </div>
            )}
            
            <div className="d-flex justify-content-end mt-4">
              <Button 
                variant="primary" 
                onClick={file ? parsePdf : () => {}}
                disabled={!file || isLoading}
              >
                {isLoading ? (
                  <>
                    <Spinner
                      as="span"
                      animation="border"
                      size="sm"
                      role="status"
                      aria-hidden="true"
                      className="me-2"
                    />
                    Processing...
                  </>
                ) : 'Process PDF'}
              </Button>
            </div>
          </>
        )}
        
        {step === 2 && (
          <>
            <Alert variant="info">
              <p>Map your Excel columns to match exactly the transaction table format.</p>
              <p>Please ensure you map each column correctly according to the standard transaction table.</p>
              <p><strong>Note:</strong> Index numbers will be assigned automatically starting from the last transaction number ({lastTransactionIndex + 1}).</p>
            </Alert>
            
            <div className="table-responsive mb-3" style={{ maxHeight: '200px', overflowY: 'auto' }}>
              {extractedText.length > 0 ? (
                <Table striped bordered hover size="sm">
                  <thead>
                    <tr>
                      {extractedText[0]?.map((header, index) => {
                        // Skip columns that are named "Column 12" or "Column 13" or are empty
                        if (header === "Column 12" || header === "Column 13" || header.trim() === "") {
                          return null;
                        }
                        return (
                          <th key={index}>
                            {header && header.trim() !== "" ? header : `Column ${index+1}`}
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    {extractedText.slice(1).map((row, rowIndex) => (
                      <tr key={rowIndex}>
                        {row.map((cell, cellIndex) => {
                          // Skip cells that correspond to columns named "Column 12" or "Column 13"
                          if (extractedText[0][cellIndex] === "Column 12" || 
                              extractedText[0][cellIndex] === "Column 13" ||
                              extractedText[0][cellIndex].trim() === "") {
                            return null;
                          }
                          return <td key={cellIndex}>{cell}</td>;
                        })}
                      </tr>
                    ))}
                  </tbody>
                </Table>
              ) : (
                <Alert variant="warning">
                  No data could be extracted in tabular format. Try exporting to Excel for manual formatting.
                </Alert>
              )}
            </div>
            
            <div className="d-flex justify-content-end mb-4">
              <Button 
                variant="outline-secondary" 
                onClick={exportToExcel}
                className="me-2"
              >
                <i className="fas fa-file-excel me-2"></i>
                Export to Excel
              </Button>
              <Button 
                variant="outline-secondary" 
                onClick={() => setStep(1)}
                className="me-2"
              >
                <i className="fas fa-arrow-left me-2"></i>
                Try Another File
              </Button>
            </div>
            
            {extractedText[0]?.length > 1 && (
              <>
                <h5>Map Fields</h5>
                <p className="text-muted">Select which column contains each field shown in the transaction table</p>
                
                <Form>
                {requiredFields.map(field => (
                  <Form.Group className="mb-3" key={field.key}>
                    <Form.Label>{field.label}</Form.Label>
                    <Form.Select
                      value={fieldMappings[field.key]?.toString() || ''}
                      onChange={(e) => updateFieldMapping(field.key, e.target.value)}
                    >
                        {renderFieldSelector()}
                    </Form.Select>
                  </Form.Group>
                ))}
                
                <div className="d-flex justify-content-between mt-4">
                  <Button variant="secondary" onClick={() => setStep(1)}>
                    Back
                  </Button>
                  <Button variant="primary" onClick={processMapping}>
                    Continue to Review
                  </Button>
                </div>
                </Form>
              </>
            )}
          </>
        )}
        
        {step === 3 && renderReviewStep()}
        
        {error && (
          <Alert variant="danger" className="mt-3">
            <p><strong>Error:</strong> {error}</p>
            {error.includes('Failed to parse PDF') && (
              <p>
                <strong>Troubleshooting:</strong> Try a different PDF file or use the Excel import option instead.
                If you're using a scanned PDF, you may need to use OCR software first to convert it to text.
              </p>
            )}
          </Alert>
        )}
        
        {success && (
          <Alert variant="success" className="mt-3">
            {success}
          </Alert>
        )}
      </Modal.Body>
      
      <Modal.Footer>
        {step === 1 && (
          <>
        <Button 
          variant="secondary" 
          onClick={onHide}
        >
          Cancel
        </Button>
          <Button 
            variant="primary" 
            onClick={file ? parsePdf : () => {}}
            disabled={!file || isLoading}
          >
            {isLoading ? (
              <>
                <Spinner
                  as="span"
                  animation="border"
                  size="sm"
                  role="status"
                  aria-hidden="true"
                  className="me-2"
                />
                Processing...
              </>
            ) : 'Process PDF'}
          </Button>
          </>
        )}

        {step === 2 && (
          <>
            <Button 
              variant="secondary" 
              onClick={() => setStep(1)}
            >
              Back
            </Button>
            <Button 
              variant="primary" 
              onClick={processMapping}
            >
              Continue to Review
            </Button>
          </>
        )}

        {step === 3 && (
          <>
            <Button 
              variant="secondary" 
              onClick={() => setStep(2)}
              disabled={!!success}
            >
              Back to Mapping
            </Button>
            <Button 
              variant="primary" 
              onClick={handleSubmit}
              disabled={isLoading || mappedData.length === 0 || !!success}
              style={{ 
                backgroundColor: "#E9FFDB", 
                border: "solid 0.5px rgba(101, 178, 53, 0.54)", 
                color: "#65B235"
              }}
            >
              {isLoading ? (
                <>
                  <Spinner
                    as="span"
                    animation="border"
                    size="sm"
                    role="status"
                    aria-hidden="true"
                    className="me-2"
                  />
                  Importing...
                </>
              ) : success ? (
                "Imported Successfully"
              ) : (
                `Import ${mappedData.length} Transactions`
              )}
            </Button>
          </>
        )}
      </Modal.Footer>
    </Modal>
  );
} 