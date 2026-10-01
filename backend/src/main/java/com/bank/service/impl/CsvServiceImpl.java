package com.bank.service.impl;

import com.bank.exception.CsvValidationException;
import com.bank.model.Bank;
import com.bank.model.Branch;
import com.bank.model.Customer;
import com.bank.model.Employee;
import com.bank.repository.BankRepository;
import com.bank.repository.BranchRepository;
import com.bank.repository.CustomerRepository;
import com.bank.repository.EmployeeRepository;
import com.bank.service.AuditLogService;
import com.bank.service.CsvService;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.util.List;
import java.util.regex.Pattern;
import org.springframework.dao.DataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import java.time.format.DateTimeParseException;
import java.util.regex.Pattern;
import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.util.*;

@Service
@RequiredArgsConstructor
public class CsvServiceImpl implements CsvService {

    private static final Pattern EMAIL = Pattern.compile("^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$");
    private static final Pattern PHONE = Pattern.compile("^[0-9+\\-\\s]{7,15}$");
    private static final Pattern IFSC = Pattern.compile("^[A-Z]{4}0[A-Z0-9]{6}$");
    private static final Pattern PINCODE = Pattern.compile("^[1-9][0-9]{5}$");
    private static final Set<String> KYC_STATUSES = Set.of("PENDING", "VERIFIED", "REJECTED");
    private static final Set<String> GENDERS = Set.of("MALE", "FEMALE", "OTHER");
    private static final Set<String> DESIGNATIONS = Set.of("MANAGER", "LOAN_OFFICER", "TELLER", "CLERK", "SECURITY", "IT_OFFICER", "ACCOUNTANT", "ASSISTANT_MANAGER");

    private final BankRepository bankRepository;
    private final BranchRepository branchRepository;
    private final CustomerRepository customerRepository;
    private final EmployeeRepository employeeRepository;
    private final JdbcTemplate jdbcTemplate;
    private final AuditLogService auditLogService;

    private List<String[]> parseRows(MultipartFile file) {
        if (file == null || file.isEmpty()) throw new CsvValidationException("CSV file is empty", List.of("No file uploaded"));
        try {
            String text = new String(file.getBytes(), StandardCharsets.UTF_8);
            text = text.replace("\r\n", "\n").replace('\r', '\n');
            List<String[]> rows = new ArrayList<>();
            List<String> cur = new ArrayList<>();
            StringBuilder field = new StringBuilder();
            boolean inQuotes = false;
            for (int i = 0; i < text.length(); i++) {
                char ch = text.charAt(i);
                if (inQuotes) {
                    if (ch == '"') {
                        if (i + 1 < text.length() && text.charAt(i + 1) == '"') { field.append('"'); i++; }
                        else inQuotes = false;
                    } else field.append(ch);
                } else {
                    if (ch == '"') inQuotes = true;
                    else if (ch == ',') { cur.add(field.toString()); field.setLength(0); }
                    else if (ch == '\n') { cur.add(field.toString()); field.setLength(0); rows.add(cur.toArray(new String[0])); cur.clear(); }
                    else field.append(ch);
                }
            }
            if (field.length() > 0 || !cur.isEmpty()) { cur.add(field.toString()); rows.add(cur.toArray(new String[0])); }
            rows.removeIf(r -> r.length == 1 && r[0].trim().isEmpty());
            if (rows.isEmpty() || rows.size() <= 1 && rows.get(0).length == 1 && rows.get(0)[0].trim().isEmpty())
                throw new CsvValidationException("CSV file has no rows", List.of("Empty file"));
            return rows;
        } catch (IOException e) {
            throw new CsvValidationException("Could not read file: " + e.getMessage(), List.of());
        }
    }

    private Map<String, Integer> headerIndex(String[] header) {
        Map<String, Integer> idx = new HashMap<>();
        for (int i = 0; i < header.length; i++) {
            String key = (header[i] == null ? "" : header[i].trim()).toLowerCase().replace("_", "").replace(" ", "");
            idx.put(key, i);
        }
        return idx;
    }

    private String cell(String[] row, Map<String, Integer> idx, String... names) {
        for (String n : names) {
            String key = n.toLowerCase().replace("_", "").replace(" ", "");
            Integer i = idx.get(key);
            if (i != null && i < row.length) return row[i] == null ? "" : row[i].trim();
        }
        return "";
    }

    @Override
    public Map<String, Object> importBanks(MultipartFile file) {
        List<String[]> rows = parseRows(file);
        Map<String, Integer> idx = headerIndex(rows.get(0));
        List<String> errors = new ArrayList<>();
        if (!idx.containsKey("bankname")) throw new CsvValidationException("Invalid CSV header: expected column 'BankName'", List.of("Missing required column: BankName"));
        int total = 0, ok = 0;
        for (int r = 1; r < rows.size(); r++) {
            String[] row = rows.get(r); total++;
            String name = cell(row, idx, "BankName", "Bank Name", "Name");
            if (name.isEmpty()) { errors.add("Row " + (r + 1) + ": BankName is required"); continue; }
            String headOffice = cell(row, idx, "HeadOffice", "Head Office", "Address");
            String contact = cell(row, idx, "ContactNo", "Contact Number", "Phone");
            String email = cell(row, idx, "Email");
            if (!email.isEmpty() && !EMAIL.matcher(email).matches()) { errors.add("Row " + (r + 1) + ": Invalid email format"); continue; }
            if (!contact.isEmpty() && !PHONE.matcher(contact).matches()) { errors.add("Row " + (r + 1) + ": Invalid phone format"); continue; }
            if (bankRepository.existsByName(name)) { errors.add("Row " + (r + 1) + ": Bank '" + name + "' already exists"); continue; }
            try {
                Bank b = Bank.builder().bankName(name).headOffice(headOffice.isEmpty() ? null : headOffice).contactNo(contact.isEmpty() ? null : contact).email(email.isEmpty() ? null : email).build();
                bankRepository.save(b);
                ok++;
            } catch (Exception e) { errors.add("Row " + (r + 1) + ": " + e.getMessage()); }
        }
        auditLogService.logAction("CSV_IMPORT", null, null, "Banks CSV: " + ok + " imported, " + errors.size() + " failed", null);
        return Map.of("totalRows", total, "successCount", ok, "errorCount", errors.size(), "errors", errors);
    }

    @Override
    public Map<String, Object> importBranches(MultipartFile file) {
        List<String[]> rows = parseRows(file);
        Map<String, Integer> idx = headerIndex(rows.get(0));
        List<String> errors = new ArrayList<>();
        if (!idx.containsKey("branchname")) throw new CsvValidationException("Invalid CSV header: expected column 'BranchName'", List.of("Missing required column: BranchName"));
        int total = 0, ok = 0;
        for (int r = 1; r < rows.size(); r++) {
            String[] row = rows.get(r); total++;
            String branch = cell(row, idx, "BranchName", "Branch Name");
            String bank = cell(row, idx, "BankName", "Bank");
            String ifsc = cell(row, idx, "IFSCCode", "IFSC Code");
            String city = cell(row, idx, "City");
            String state = cell(row, idx, "State");
            String pincode = cell(row, idx, "Pincode", "PinCode", "Pin Code");
            String address = cell(row, idx, "Address", "StreetAddress");
            String contact = cell(row, idx, "ContactNumber", "Contact Number", "Phone");
            String email = cell(row, idx, "Email");
            if (branch.isEmpty()) { errors.add("Row " + (r + 1) + ": BranchName is required"); continue; }
            if (bank.isEmpty()) { errors.add("Row " + (r + 1) + ": BankName is required"); continue; }
            Long bankId = null;
            if (!bankRepository.existsByName(bank)) { errors.add("Row " + (r + 1) + ": Bank '" + bank + "' does not exist"); continue; }
            else bankId = bankRepository.findByName(bank).map(Bank::getBankId).orElse(null);
            if (!ifsc.isEmpty() && !IFSC.matcher(ifsc).matches()) { errors.add("Row " + (r + 1) + ": Invalid IFSC format"); continue; }
            if (!pincode.isEmpty() && !PINCODE.matcher(pincode).matches()) { errors.add("Row " + (r + 1) + ": Invalid pincode format"); continue; }
            if (branchRepository.existsByIfscCode(ifsc)) { errors.add("Row " + (r + 1) + ": IFSC '" + ifsc + "' already exists"); continue; }
            try {
                Branch br = Branch.builder().bankId(bankId).branchName(branch).ifscCode(ifsc.isEmpty() ? null : ifsc).city(city.isEmpty() ? null : city).state(state.isEmpty() ? null : state).pincode(pincode.isEmpty() ? null : pincode).address(address.isEmpty() ? null : address).contactNumber(contact.isEmpty() ? null : contact).email(email.isEmpty() ? null : email).build();
                branchRepository.save(br);
                ok++;
            } catch (Exception e) { errors.add("Row " + (r + 1) + ": " + e.getMessage()); }
        }
        auditLogService.logAction("CSV_IMPORT", null, null, "Branches CSV: " + ok + " imported, " + errors.size() + " failed", null);
        return Map.of("totalRows", total, "successCount", ok, "errorCount", errors.size(), "errors", errors);
    }

    @Override
    public Map<String, Object> importCustomers(MultipartFile file) {
        List<String[]> rows = parseRows(file);
        Map<String, Integer> idx = headerIndex(rows.get(0));
        List<String> errors = new ArrayList<>();
        if (!idx.containsKey("email")) throw new CsvValidationException("Invalid CSV header: expected column 'Email'", List.of("Missing required column: Email"));
        int total = 0, ok = 0;
        for (int r = 1; r < rows.size(); r++) {
            String[] row = rows.get(r); total++;
            String email = cell(row, idx, "Email");
            if (email.isEmpty()) { errors.add("Row " + (r + 1) + ": Email is required"); continue; }
            if (!EMAIL.matcher(email).matches()) { errors.add("Row " + (r + 1) + ": Invalid email format"); continue; }
            if (customerRepository.existsByEmail(email)) { errors.add("Row " + (r + 1) + ": Customer with email '" + email + "' already exists"); continue; }
            String firstName = cell(row, idx, "FirstName", "First Name", "Firstname");
            String lastName = cell(row, idx, "LastName", "Last Name", "Lastname");
            String phone = cell(row, idx, "Phone");
            if (!phone.isEmpty() && !PHONE.matcher(phone).matches()) { errors.add("Row " + (r + 1) + ": Invalid phone format"); continue; }
            String kyc = cell(row, idx, "KycStatus", "Kyc Status", "Kyc_Status");
            if (!kyc.isEmpty() && !KYC_STATUSES.contains(kyc.toUpperCase())) { errors.add("Row " + (r + 1) + ": Invalid KYC status"); continue; }
            String gender = cell(row, idx, "Gender");
            if (!gender.isEmpty() && !GENDERS.contains(gender.toUpperCase())) { errors.add("Row " + (r + 1) + ": Invalid gender"); continue; }
            String address = cell(row, idx, "Address");
            String dobStr = cell(row, idx, "Dob", "Dob", "DateOfBirth", "DateOfBirth");
            LocalDate dob = null;
            if (!dobStr.isEmpty()) {
                try { dob = LocalDate.parse(dobStr); } catch (DateTimeParseException e) { errors.add("Row " + (r + 1) + ": Invalid date format (expected yyyy-MM-dd)"); continue; }
            }
            try {
                Customer c = Customer.builder().email(email).firstName(firstName).lastName(lastName).phone(phone.isEmpty() ? null : phone).kycStatus(kyc.isEmpty() ? "PENDING" : kyc.toUpperCase()).gender(gender.isEmpty() ? null : gender.toUpperCase()).address(address.isEmpty() ? null : address).dob(dob).build();
                customerRepository.save(c);
                ok++;
            } catch (Exception e) { errors.add("Row " + (r + 1) + ": " + e.getMessage()); }
        }
        auditLogService.logAction("CSV_IMPORT", null, null, "Customers CSV: " + ok + " imported, " + errors.size() + " failed", null);
        return Map.of("totalRows", total, "successCount", ok, "errorCount", errors.size(), "errors", errors);
    }

    @Override
    public Map<String, Object> importEmployees(MultipartFile file) {
        List<String[]> rows = parseRows(file);
        Map<String, Integer> idx = headerIndex(rows.get(0));
        List<String> errors = new ArrayList<>();
        if (!idx.containsKey("firstname")) throw new CsvValidationException("Invalid CSV header: expected column 'FirstName'", List.of("Missing required column: FirstName"));
        int total = 0, ok = 0;
        for (int r = 1; r < rows.size(); r++) {
            String[] row = rows.get(r); total++;
            String firstName = cell(row, idx, "FirstName", "First Name", "Firstname");
            if (firstName.isEmpty()) { errors.add("Row " + (r + 1) + ": FirstName is required"); continue; }
            String lastName = cell(row, idx, "LastName", "Last Name", "Lastname");
            String designation = cell(row, idx, "Designation");
            if (!designation.isEmpty() && !DESIGNATIONS.contains(designation.toUpperCase())) { errors.add("Row " + (r + 1) + ": Invalid designation"); continue; }
            String salaryStr = cell(row, idx, "Salary");
            BigDecimal salary = null;
            if (!salaryStr.isEmpty()) { try { salary = new BigDecimal(salaryStr); } catch (Exception e) { errors.add("Row " + (r + 1) + ": Invalid salary format"); continue; } }
            String email = cell(row, idx, "Email");
            if (email.isEmpty()) { errors.add("Row " + (r + 1) + ": Email is required"); continue; }
            if (!EMAIL.matcher(email).matches()) { errors.add("Row " + (r + 1) + ": Invalid email format"); continue; }
            int emailCount = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM EMPLOYEE WHERE EMAIL = ?", Integer.class, email);
            if (emailCount > 0) { errors.add("Row " + (r + 1) + ": Employee with email '" + email + "' already exists"); continue; }
            String phone = cell(row, idx, "Phone");
            if (!phone.isEmpty() && !PHONE.matcher(phone).matches()) { errors.add("Row " + (r + 1) + ": Invalid phone format"); continue; }
            String branch = cell(row, idx, "BranchId", "BranchId", "Branch");
            Long branchId = null;
            if (!branch.isEmpty()) { try { branchId = Long.parseLong(branch); } catch (Exception e) { errors.add("Row " + (r + 1) + ": Invalid BranchId"); continue; } }
            if (branchId != null && !branchRepository.findById(branchId).isPresent()) { errors.add("Row " + (r + 1) + ": BranchId " + branch + " does not exist"); continue; }
            String joinDateStr = cell(row, idx, "JoinDate", "Join Date", "HireDate", "Hire_Date");
            LocalDate joinDate = null;
            if (!joinDateStr.isEmpty()) { try { joinDate = LocalDate.parse(joinDateStr); } catch (DateTimeParseException e) { errors.add("Row " + (r + 1) + ": Invalid join date format"); continue; } }
            try {
                Employee emp = Employee.builder().firstName(firstName).lastName(lastName).designation(designation.isEmpty() ? null : designation.toUpperCase()).salary(salary).email(email).phone(phone.isEmpty() ? null : phone).branchId(branchId).joinDate(joinDate).build();
                employeeRepository.save(emp);
                ok++;
            } catch (Exception e) { errors.add("Row " + (r + 1) + ": " + e.getMessage()); }
        }
        auditLogService.logAction("CSV_IMPORT", null, null, "Employees CSV: " + ok + " imported, " + errors.size() + " failed", null);
        return Map.of("totalRows", total, "successCount", ok, "errorCount", errors.size(), "errors", errors);
    }

    // ----------- Exports -----------

    private String esc(String v) {
        if (v == null || v.isEmpty()) return "";
        if (v.contains(",") || v.contains("\"") || v.contains("\n") || v.contains("\r")) {
            return "\"" + v.replace("\"", "\"\"") + "\"";
        }
        return v;
    }

    private String str(Object obj) {
        return obj != null ? obj.toString() : "";
    }

    @Override
    public byte[] exportBanks() {
        String sql = "SELECT Bank_Name AS \"BankName\", Head_Office AS \"HeadOffice\", Contact_No AS \"ContactNo\", Email AS \"Email\" FROM BANK ORDER BY Bank_Name";
        List<String[]> rows = new ArrayList<>();
        List<Map<String, Object>> data = jdbcTemplate.queryForList(sql);
        for (Map<String, Object> m : data) {
            rows.add(new String[]{
                str(m.get("BankName")),
                str(m.get("HeadOffice")),
                str(m.get("ContactNo")),
                str(m.get("Email"))
            });
        }
        return buildCsv("BankName,HeadOffice,ContactNo,Email", rows);
    }

    @Override
    public byte[] exportBranches() {
        String sql = "SELECT b.Branch_Name AS \"BranchName\", b.IFSC_Code AS \"IFSCCode\", b.City AS \"City\", b.State AS \"State\", b.Pincode AS \"Pincode\", b.Address AS \"Address\", b.Contact_Number AS \"ContactNumber\", b.Email AS \"Email\", ba.Bank_Name AS \"BankName\" FROM BRANCH b JOIN BANK ba ON b.Bank_ID = ba.Bank_ID ORDER BY b.Branch_Name";
        List<String[]> rows = new ArrayList<>();
        List<Map<String, Object>> data = jdbcTemplate.queryForList(sql);
        for (Map<String, Object> m : data) {
            rows.add(new String[]{
                str(m.get("BranchName")),
                str(m.get("IFSCCode")),
                str(m.get("City")),
                str(m.get("State")),
                str(m.get("Pincode")),
                str(m.get("Address")),
                str(m.get("ContactNumber")),
                str(m.get("Email")),
                str(m.get("BankName"))
            });
        }
        return buildCsv("BranchName,IFSCCode,City,State,Pincode,Address,ContactNumber,Email,BankName", rows);
    }

    @Override
    public byte[] exportCustomers() {
        String sql = "SELECT c.First_Name AS \"FirstName\", c.Last_Name AS \"LastName\", c.Email AS \"Email\", c.Phone AS \"Phone\", TO_CHAR(c.Dob, 'YYYY-MM-DD') AS \"Dob\", c.Kyc_Status AS \"KycStatus\", c.Gender AS \"Gender\", c.Address AS \"Address\" FROM CUSTOMER c ORDER BY c.First_Name";
        List<String[]> rows = new ArrayList<>();
        List<Map<String, Object>> data = jdbcTemplate.queryForList(sql);
        for (Map<String, Object> m : data) {
            rows.add(new String[]{
                str(m.get("FirstName")),
                str(m.get("LastName")),
                str(m.get("Email")),
                str(m.get("Phone")),
                str(m.get("Dob")),
                str(m.get("KycStatus")),
                str(m.get("Gender")),
                str(m.get("Address"))
            });
        }
        return buildCsv("FirstName,LastName,Email,Phone,Dob,KycStatus,Gender,Address", rows);
    }

    @Override
    public byte[] exportEmployees() {
        String sql = "SELECT e.First_Name AS \"FirstName\", e.Last_Name AS \"LastName\", e.Designation AS \"Designation\", e.Salary AS \"Salary\", e.Email AS \"Email\", e.Phone AS \"Phone\", TO_CHAR(e.Join_Date, 'YYYY-MM-DD') AS \"JoinDate\", br.Branch_Name AS \"BranchName\" FROM EMPLOYEE e LEFT JOIN BRANCH br ON e.Branch_ID = br.Branch_ID ORDER BY e.First_Name";
        List<String[]> rows = new ArrayList<>();
        List<Map<String, Object>> data = jdbcTemplate.queryForList(sql);
        for (Map<String, Object> m : data) {
            rows.add(new String[]{
                str(m.get("FirstName")),
                str(m.get("LastName")),
                str(m.get("Designation")),
                str(m.get("Salary")),
                str(m.get("Email")),
                str(m.get("Phone")),
                str(m.get("JoinDate")),
                str(m.get("BranchName"))
            });
        }
        return buildCsv("FirstName,LastName,Designation,Salary,Email,Phone,JoinDate,BranchName", rows);
    }

    @Override
    public byte[] exportAccounts() {
        String sql = "SELECT a.Account_No AS \"AccountNo\", c.First_Name || ' ' || c.Last_Name AS \"CustomerName\", a.Account_Type AS \"AccountType\", b.Branch_Name AS \"BranchName\", a.Balance AS \"Balance\", a.Status AS \"Status\", TO_CHAR(a.Opened_Date, 'YYYY-MM-DD') AS \"OpenedDate\" FROM ACCOUNT a JOIN CUSTOMER c ON a.Customer_ID = c.Customer_ID JOIN BRANCH b ON a.Branch_ID = b.Branch_ID ORDER BY a.Account_No";
        List<String[]> rows = new ArrayList<>();
        List<Map<String, Object>> data = jdbcTemplate.queryForList(sql);
        for (Map<String, Object> m : data) {
            rows.add(new String[]{
                str(m.get("AccountNo")),
                str(m.get("CustomerName")),
                str(m.get("AccountType")),
                str(m.get("BranchName")),
                str(m.get("Balance")),
                str(m.get("Status")),
                str(m.get("OpenedDate"))
            });
        }
        return buildCsv("AccountNo,CustomerName,AccountType,BranchName,Balance,Status,OpenedDate", rows);
    }

    @Override
    public byte[] exportTransactions() {
        String sql = "SELECT t.Txn_Type AS \"TxnType\", TO_CHAR(t.Txn_Date, 'YYYY-MM-DD') AS \"TxnDate\", t.Account_No AS \"AccountNo\", t.Amount AS \"Amount\", t.Balance_After AS \"BalanceAfter\", t.Channel AS \"Channel\", t.Remarks AS \"Remarks\" FROM TRANSACTION t ORDER BY t.Txn_Date DESC";
        List<String[]> rows = new ArrayList<>();
        List<Map<String, Object>> data = jdbcTemplate.queryForList(sql);
        for (Map<String, Object> m : data) {
            rows.add(new String[]{
                str(m.get("TxnType")),
                str(m.get("TxnDate")),
                str(m.get("AccountNo")),
                str(m.get("Amount")),
                str(m.get("BalanceAfter")),
                str(m.get("Channel")),
                str(m.get("Remarks"))
            });
        }
        return buildCsv("TxnType,TxnDate,AccountNo,Amount,BalanceAfter,Channel,Remarks", rows);
    }

    @Override
    public byte[] exportLoans() {
        String sql = "SELECT l.Loan_Id AS \"LoanId\", c.First_Name || ' ' || c.Last_Name AS \"CustomerName\", l.Loan_Type AS \"LoanType\", l.Principal_Amount AS \"PrincipalAmount\", l.Outstanding_Bal AS \"OutstandingBal\", l.Loan_Status AS \"Status\", TO_CHAR(l.Sanction_Date, 'YYYY-MM-DD') AS \"SanctionDate\" FROM LOAN l JOIN CUSTOMER c ON l.Customer_ID = c.Customer_ID ORDER BY l.Loan_Id";
        List<String[]> rows = new ArrayList<>();
        List<Map<String, Object>> data = jdbcTemplate.queryForList(sql);
        for (Map<String, Object> m : data) {
            rows.add(new String[]{
                str(m.get("LoanId")),
                str(m.get("CustomerName")),
                str(m.get("LoanType")),
                str(m.get("PrincipalAmount")),
                str(m.get("OutstandingBal")),
                str(m.get("Status")),
                str(m.get("SanctionDate"))
            });
        }
        return buildCsv("LoanId,CustomerName,LoanType,PrincipalAmount,OutstandingBal,Status,SanctionDate", rows);
    }

    private byte[] buildCsv(String headers, List<String[]> rows) {
        try {
            StringBuilder sb = new StringBuilder();
            sb.append(headers).append("\r\n");
            for (String[] row : rows) {
                StringBuilder r = new StringBuilder();
                for (int i = 0; i < row.length; i++) {
                    if (i > 0) r.append(",");
                    r.append(esc(row[i]));
                }
                sb.append(r).append("\r\n");
            }
            return sb.toString().getBytes(StandardCharsets.UTF_8);
        } catch (Exception e) {
            return new byte[0];
        }
    }
}