// Global variables
let employees = [];
let attendance = [];
let leaves = [];
let payroll = [];
let recruitment = [];
let performanceData = [];
let documentsData = [];
let holidays = [];

// GOOGLE DRIVE BACKUP CONFIG
const CLIENT_ID = "556160873768-kr35jjf2cr03n6rbm1s6rl7rqik831jr.apps.googleusercontent.com";
const API_KEY = "YOUR_API_KEY_HERE";  // <-- create API key in Google console
const SCOPES = "https://www.googleapis.com/auth/drive.file";

let GoogleAuth;

/// Initialize Google API
function initGoogleDrive() {
    gapi.load("client:auth2", async () => {
        await gapi.client.init({
            apiKey: API_KEY,
            clientId: CLIENT_ID,
            scope: SCOPES
        });

        GoogleAuth = gapi.auth2.getAuthInstance();

        GoogleAuth.signIn().then(() => {
            document.getElementById("gStatus").innerText = "✔ Google Login Successful";
        });
    });
}

/// Create HRMS backup JSON file
function createHRMSBackupJSON() {
    const data = {
        employees,
        attendance,
        leaves,
        payroll,
        recruitment,
        performanceData,
        documentsData,
        payslips,
        holidays,
        timestamp: new Date().toISOString()
    };

    return JSON.stringify(data, null, 2);
}

/// Upload JSON file to Google Drive
async function backupToDrive() {
    if (!GoogleAuth || !GoogleAuth.isSignedIn.get()) {
        return alert("Please Login to Google First!");
    }

    const fileContent = createHRMSBackupJSON();
    const blob = new Blob([fileContent], { type: "application/json" });

    const metadata = {
        name: "HRMS_Backup_" +
            new Date().toISOString().replace(/[:.]/g, "-") +
            ".json",
        mimeType: "application/json"
    };

    const formData = new FormData();
    formData.append(
        "metadata",
        new Blob([JSON.stringify(metadata)], {
            type: "application/json"
        })
    );
    formData.append("file", blob);

    const accessToken =
        GoogleAuth.currentUser.get().getAuthResponse(true).access_token;

    const response = await fetch(
        "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart",
        {
            method: "POST",
            headers: new Headers({
                Authorization: "Bearer " + accessToken
            }),
            body: formData
        }
    );

    const result = await response.json();

    document.getElementById("gStatus").innerText =
        "✔ Backup Uploaded to Google Drive: " + result.name;
}

// Notification system
function showNotif(msg, error=false) {
const n = document.getElementById('notif');
n.textContent = msg;
n.className = 'notif' + (error ? ' error' : '');
n.style.display = 'block';
setTimeout(()=>{ n.style.display = 'none'; }, 2000);
}

// Panel rendering functions
function employeePanel() {
  return `
    <!-- Header -->
    <div style="
      background: linear-gradient(90deg,#223043 80%,#2980b9 100%);
      color:#fff;padding:1.2rem 2rem;
      border-radius:12px 12px 0 0;
      box-shadow:0 2px 12px rgba(44,62,80,0.10);
      display:flex;align-items:center;gap:1rem;">
      <span style="font-size:2rem;">&#128197;</span>
      <div>
        <h1 style="margin:0;font-size:1.6rem;">Employee Database
          <span style="font-size:1rem;color:#bfc9d1;">(HR Admin)</span>
        </h1>
        <div style="font-size:1.05rem;margin-top:0.2rem;">
          Add, edit, and manage employee records
        </div>
      </div>
    </div>

    <!-- Employee Form -->
    <form id="addEmpForm" autocomplete="off" style="
      display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));
      gap:1.2rem 2rem;align-items:end;
      max-width:1200px;margin:1.5rem auto;
      background:#fff;border-radius:14px;
      box-shadow:0 6px 24px rgba(44,62,80,0.12);
      padding:2rem;">

      ${[
        {id:"empId",label:"Employee ID",type:"text",req:true},
        {id:"empName",label:"Name",type:"text",req:true},
        {id:"empDept",label:"Department",type:"text",req:true},
        {id:"empEmail",label:"Email",type:"email",req:true},
        {id:"empMobile",label:"Mobile",type:"text",req:true},
        {id:"empAddress",label:"Address",type:"text",req:true},
        {id:"empDoj",label:"Date of Joining",type:"date",req:true},
        {id:"empDoj1yr",label:"Increment",type:"date",req:false,extra:'readonly style="background:#f8fafc;"'},
        {id:"empBasicSalary",label:"Basic Salary",type:"number",req:true},
        {id:"empAllowances",label:"Allowances",type:"number",req:true},
      ].map(f => `
        <div>
          <label for="${f.id}" style="font-weight:bold;">${f.label}</label>
          <input type="${f.type}" id="${f.id}" placeholder="${f.label}" ${f.req?"required":""} ${f.extra||""}>
        </div>`).join("")}

      <!-- Dropdown fields -->
      <div>
        <label for="empPFApplicable" style="font-weight:bold;">PF</label>
        <select id="empPFApplicable" required>
          <option value="applicable">Applicable</option>
          <option value="not_applicable">Not Applicable</option>
        </select>
      </div>
      <div>
        <label for="empESIApplicable" style="font-weight:bold;">ESI</label>
        <select id="empESIApplicable" required>
          <option value="applicable">Applicable</option>
          <option value="not_applicable">Not Applicable</option>
        </select>
      </div>
      <div>
        <label for="empTDSApplicable" style="font-weight:bold;">TDS</label>
        <select id="empTDSApplicable" required>
          <option value="applicable">Applicable</option>
          <option value="not_applicable">Not Applicable</option>
        </select>
      </div>

      <!-- Leave fields -->
      <div>
        <label for="empCasualLeave" style="font-weight:bold;">Casual Leave (Paid)</label>
        <input type="number" id="empCasualLeave" placeholder="Casual Leave" min="0" value="0">
      </div>
      <div>
        <label for="empSickLeave" style="font-weight:bold;">Sick Leave (Paid)</label>
        <input type="number" id="empSickLeave" placeholder="Sick Leave" min="0" value="0">
      </div>
      <div>
        <label for="empPaidLeave" style="font-weight:bold;">Paid Leave</label>
        <input type="number" id="empPaidLeave" placeholder="Paid Leave" min="0" value="0">
      </div>

      <div style="grid-column:1/-1;text-align:right;">
        <button type="submit" style="
          width:260px;padding:0.8rem;
          border:none;border-radius:8px;
          background:#2980b9;color:#fff;
          font-weight:bold;font-size:1rem;
          cursor:pointer;transition:0.2s;">
          Add Employee
        </button>
      </div>
    </form>

    <!-- Search + Export + Increment Sheet Button -->
    <div style="
      display:flex;flex-wrap:wrap;
      gap:0.5rem;align-items:center;
      margin:0 0 1rem 0;justify-content:space-between;">
      <input class="search-bar" id="empSearch" placeholder="Search employees..."
        style="flex:1 1 200px;max-width:220px;padding:0.6rem;border-radius:8px;border:1px solid #ccc;">
      <div>
        <button id="openIncrementSheet" style="
          padding:0.6rem 1.2rem;border:none;
          border-radius:8px;background:#e67e22;
          color:#fff;cursor:pointer;transition:0.2s;margin-right:0.5rem;">
          Increment Updates Sheet
        </button>
        <button class="export-btn" id="empExport" style="
          padding:0.6rem 1.2rem;border:none;
          border-radius:8px;background:#27ae60;
          color:#fff;cursor:pointer;transition:0.2s;">
          Export CSV
        </button>
      </div>
    </div>

    <!-- Employee Table -->
    <div style="overflow-x:auto;">
      <table style="min-width:1200px;width:100%;border-collapse:collapse;">
        <thead>
          <tr>
            <th>ID</th><th>Name</th><th>Department</th>
            <th>Email</th><th>Mobile</th><th>Address</th>
            <th>D.O.J</th><th>Increment</th>
            <th>Basic Salary</th><th>Allowances</th>
            <th>PF</th><th>ESI</th><th>TDS</th>
            <th>CL</th><th>SL</th><th>PL</th>
            <th>C-OFF</th><th>TOTAL</th><th>Action</th>
          </tr>
        </thead>
        <tbody id="empTableBody"></tbody>
      </table>
    </div>
  `;
}

// Increment Sheet Panel
function incrementSheetPanel() {
  return `
    <!-- Header -->
    <div style="
      background: linear-gradient(90deg,#223043 80%,#e67e22 100%);
      color:#fff;padding:1.2rem 2rem;
      border-radius:12px 12px 0 0;
      box-shadow:0 2px 12px rgba(44,62,80,0.10);
      display:flex;align-items:center;gap:1rem;">
      <span style="font-size:2rem;">&#128200;</span>
      <div>
        <h1 style="margin:0;font-size:1.6rem;">Increment Updates Sheet
          <span style="font-size:1rem;color:#bfc9d1;">(HR Admin)</span>
        </h1>
        <div style="font-size:1.05rem;margin-top:0.2rem;">
          Track employee salary increments over the years
        </div>
      </div>
    </div>

    <!-- Controls -->
    <div style="
      display:flex;flex-wrap:wrap;
      gap:0.5rem;align-items:center;
      margin:1rem 0;justify-content:space-between;">
      <div style="display:flex;gap:0.5rem;align-items:center;">
        <input class="search-bar" id="incrementSearch" placeholder="Search employees..."
          style="padding:0.6rem;border-radius:8px;border:1px solid #ccc;">
        <select id="yearFilter" style="padding:0.6rem;border-radius:8px;border:1px solid #ccc;">
          <option value="">All Years</option>
          ${Array.from({length: 16}, (_, i) => 2011 + i).map(year => 
            `<option value="${year}">${year}</option>`
          ).join('')}
        </select>
      </div>
      <div>
        <button id="backToEmployeePanel" style="
          padding:0.6rem 1.2rem;border:none;
          border-radius:8px;background:#95a5a6;
          color:#fff;cursor:pointer;transition:0.2s;margin-right:0.5rem;">
          Back to Employee Panel
        </button>
        <button class="export-btn" id="incrementExport" style="
          padding:0.6rem 1.2rem;border:none;
          border-radius:8px;background:#27ae60;
          color:#fff;cursor:pointer;transition:0.2s;">
          Export CSV
        </button>
      </div>
    </div>

    <!-- Increment Sheet Table -->
    <div style="overflow-x:auto;">
      <table style="min-width:1400px;width:100%;border-collapse:collapse;">
        <thead>
          <tr>
            <th rowspan="2">No.</th>
            <th rowspan="2">Name of Employee</th>
            <th rowspan="2">Employee Code</th>
            <th rowspan="2">Joining Date</th>
            <th rowspan="2">Joining Salary</th>
            <th colspan="16" style="text-align:center;background:#f8f9fa;">Yearly Salary</th>
          </tr>
          <tr>
            ${Array.from({length: 16}, (_, i) => 2011 + i).map(year => 
              `<th style="writing-mode:vertical-lr;text-orientation:mixed;">${year}</th>`
            ).join('')}
          </tr>
        </thead>
        <tbody id="incrementTableBody">
          <!-- Sample data row -->
          <tr>
            <td>1</td>
            <td>M.NAGAMANI</td>
            <td>EMP001</td>
            <td>15/03/2010</td>
            <td>15,000</td>
            <td style="background:#fff9c4;">15,000</td>
            <td style="background:#fff9c4;">16,500</td>
            <td style="background:#fff9c4;">18,000</td>
            <td style="background:#fff9c4;">19,500</td>
            <td style="background:#fff9c4;">21,000</td>
            <td style="background:#fff9c4;">22,500</td>
            <td style="background:#fff9c4;">24,000</td>
            <td style="background:#fff9c4;">25,500</td>
            <td style="background:#fff9c4;">27,000</td>
            <td style="background:#fff9c4;">28,500</td>
            <td style="background:#fff9c4;">30,000</td>
            <td style="background:#fff9c4;">31,500</td>
            <td style="background:#fff9c4;">33,000</td>
            <td style="background:#fff9c4;">34,500</td>
            <td style="background:#fff9c4;">36,000</td>
            <td style="background:#fff9c4;">37,500</td>
          </tr>
          <tr>
            <td>2</td>
            <td>L S S S NOOKARAJU (SRINIVAS)</td>
            <td>EMP002</td>
            <td>01/07/2011</td>
            <td>18,000</td>
            <td>-</td>
            <td style="background:#fff9c4;">18,000</td>
            <td style="background:#fff9c4;">19,800</td>
            <td style="background:#fff9c4;">21,600</td>
            <td style="background:#fff9c4;">23,400</td>
            <td style="background:#fff9c4;">25,200</td>
            <td style="background:#fff9c4;">27,000</td>
            <td style="background:#fff9c4;">28,800</td>
            <td style="background:#fff9c4;">30,600</td>
            <td style="background:#fff9c4;">32,400</td>
            <td style="background:#fff9c4;">34,200</td>
            <td style="background:#fff9c4;">36,000</td>
            <td style="background:#fff9c4;">37,800</td>
            <td style="background:#fff9c4;">39,600</td>
            <td style="background:#fff9c4;">41,400</td>
            <td style="background:#fff9c4;">43,200</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Summary Section -->
    <div style="
      margin-top:1.5rem;
      background:#f8f9fa;
      border-radius:8px;
      padding:1rem;
      display:flex;
      justify-content:space-around;
      flex-wrap:wrap;">
      <div style="text-align:center;padding:0.5rem;">
        <div style="font-size:1.8rem;font-weight:bold;color:#2980b9;">24</div>
        <div>Total Employees</div>
      </div>
      <div style="text-align:center;padding:0.5rem;">
        <div style="font-size:1.8rem;font-weight:bold;color:#27ae60;">8.5%</div>
        <div>Avg. Increment Rate</div>
      </div>
      <div style="text-align:center;padding:0.5rem;">
        <div style="font-size:1.8rem;font-weight:bold;color:#e74c3c;">₹42,500</div>
        <div>Avg. Current Salary</div>
      </div>
      <div style="text-align:center;padding:0.5rem;">
        <div style="font-size:1.8rem;font-weight:bold;color:#8e44ad;">12</div>
        <div>Pending Reviews</div>
      </div>
    </div>
  `;
}

// Initialize the application
function initApp() {
  // Render initial panel
  document.getElementById('app-container').innerHTML = employeePanel();
  
  // Add event listener for increment sheet button
  document.getElementById('openIncrementSheet').addEventListener('click', () => {
    document.getElementById('app-container').innerHTML = incrementSheetPanel();
    addIncrementSheetEventListeners();
  });
}

// Add event listeners for increment sheet
function addIncrementSheetEventListeners() {
  // Back button
  document.getElementById('backToEmployeePanel').addEventListener('click', () => {
    document.getElementById('app-container').innerHTML = employeePanel();
    initApp();
  });
  
  // Export functionality
  document.getElementById('incrementExport').addEventListener('click', () => {
    alert('Export functionality would be implemented here');
  });
  
  // Search functionality
  document.getElementById('incrementSearch').addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase();
    const rows = document.querySelectorAll('#incrementTableBody tr');
    
    rows.forEach(row => {
      const text = row.textContent.toLowerCase();
      row.style.display = text.includes(searchTerm) ? '' : 'none';
    });
  });
  
  // Year filter
  document.getElementById('yearFilter').addEventListener('change', (e) => {
    const year = e.target.value;
    const columnIndex = year ? parseInt(year) - 2010 : null;
    
    const rows = document.querySelectorAll('#incrementTableBody tr');
    rows.forEach(row => {
      const cells = row.querySelectorAll('td');
      cells.forEach((cell, index) => {
        if (index >= 5) { // Starting from year columns
          if (columnIndex === null || index === columnIndex + 4) {
            cell.style.display = '';
          } else {
            cell.style.display = 'none';
          }
        }
      });
    });
  });
}

// Start the application when DOM is loaded
document.addEventListener('DOMContentLoaded', initApp);

// Helper function to calculate late arrivals
function calculateLateArrivals() {
const lateCounts = {};
attendance.forEach(a => {
if (a.status === "Late") {
const key = (a.employeeId || "") + "|" + (a.employee || "");
lateCounts[key] = (lateCounts[key] || 0) + 1;
}
});
return lateCounts;
}

// Helper function to calculate COFF (Compensatory Off)
function calculateCOFF() {
const coffSummary = {};
attendance.forEach(a => {
if (a.extraHours && !isNaN(a.extraHours) && a.extraHours > 0 && a.employeeId && a.employee) {
const key = (a.employeeId || "") + "|" + (a.employee || "");
coffSummary[key] = (coffSummary[key] || 0) + parseFloat(a.extraHours);
}
});

return Object.entries(coffSummary).map(([key, totalExtra]) => {
const [empId, empName] = key.split("|");
const coffDays = Math.floor(totalExtra / 8);
return `<tr><td>${empId}</td><td>${empName}</td><td>${totalExtra.toFixed(2)}</td><td>${coffDays > 0 ? coffDays : ""}</td></tr>`;
}).filter(row => row.includes("<td>") && !row.includes("<td>0</td>")).join("");
}

// Helper function to create auto Sundays button
function createAutoSundaysButton() {
return `
<button class="export-btn" id="autoSundaysPresent" style="flex:0 0 180px;background:#27ae60;">Auto Sundays & Holidays Present</button>
<input type="month" id="autoSundaysMonth" style="margin-left:0.5rem;max-width:140px;">
<button class="export-btn" id="resetAttendance" style="flex:0 0 120px;background:#e74c3c;">Reset Attendance</button>
`;
}

// Helper function to create attendance form
function createAttendanceForm() {
return `
<div style="background:#fff;padding:2rem 1.5rem 1.5rem 1.5rem;border-radius:0 0 12px 12px;box-shadow:0 4px 24px rgba(44,62,80,0.10);margin-bottom:2rem;">
<form id="addAttForm" autocomplete="off" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:1rem;align-items:end;">
<div>
<label for="attEmpId" style="font-weight:bold;">Employee ID</label>
<input list="empList" id="attEmpId" placeholder="Employee ID" required>
<datalist id="empList">
${employees.map(e => `<option value="${e.id}">${e.name}</option>`).join('')}
</datalist>
</div>
<div>
<label for="attEmp" style="font-weight:bold;">Employee Name</label>
<input type="text" id="attEmp" placeholder="Employee Name" required>
</div>
<div>
<label for="attDate" style="font-weight:bold;">Date</label>
<input type="date" id="attDate" required>
</div>
<div>
<label for="attStatus" style="font-weight:bold;">Status</label>
<select id="attStatus" required>
<option value="">Status</option>
<option>Present</option>
<option>Absent</option>
<option>Late</option>
<option>Half Day</option>
</select>
</div>
<div>
<label for="attDesc" style="font-weight:bold;">Description</label>
<input type="text" id="attDesc" placeholder="Description">
</div>
<div>
<label style="font-weight:bold;">Morning In</label>
<input type="time" id="attMorningIn" value="09:00">
</div>
<div>
<label style="font-weight:bold;">Morning Out</label>
<input type="time" id="attMorningOut" value="13:00">
</div>
<div>
<label style="font-weight:bold;">Afternoon In</label>
<input type="time" id="attAfternoonIn" value="13:30">
</div>
<div>
<label style="font-weight:bold;">Evening Out</label>
<input type="time" id="attEveningOut" value="18:00">
</div>
<div>
<label style="font-weight:bold;">Extra Hours</label>
<input type="number" id="attExtraHours" min="0" step="0.25" placeholder="Extra Hours">
</div>
<div style="grid-column:1/-1;margin-top:0.5rem;color:#e67e22;font-size:0.98rem;">
<b>Note:</b> If Morning In is after 09:05, status will be set to <b>Late</b> automatically.
</div>
<div style="grid-column:1/-1;text-align:right;">
<button type="submit" style="width:160px;">Add Attendance</button>
</div>
</form>
</div>
`;
}

// Helper function to create action buttons
function createActionButtons() {
return `
<div style="display:flex;flex-wrap:wrap;gap:0.2rem 0.3rem;align-items:center;margin:0 0 0.5rem 0;">
<input class="search-bar" id="attSearch" placeholder="Search attendance..." style="flex:1 1 100px;max-width:180px;">
<button class="export-btn" id="attExport" style="flex:0 0 90px;">Export CSV</button>
<button class="export-btn" id="attSyncBiometric" style="flex:0 0 180px;">Sync Biometric Attendance</button>
<input type="file" id="biometricFile" accept=".csv" style="display:none;">
${createAutoSundaysButton()}
</div>
`;
}

// Helper function to create attendance table
function createAttendanceTable() {
return `
<div style="overflow-x:auto;">
<table style="min-width:1100px;">
<thead>
<tr>
<th data-col="employeeId">Employee ID &#8597;</th>
<th data-col="employee">Employee &#8597;</th>
<th data-col="date">Date &#8597;</th>
<th data-col="status">Status &#8597;</th>
<th data-col="description">Description &#8597;</th>
<th data-col="morningIn">Morning In</th>
<th data-col="morningOut">Morning Out</th>
<th data-col="afternoonIn">Afternoon In</th>
<th data-col="eveningOut">Evening Out</th>
<th data-col="extraHours">Extra Hours</th>
<th>Action</th>
</tr>
</thead>
<tbody id="attTableBody"></tbody>
</table>
</div>
`;
}

// Helper function to create summary tables
function createSummaryTables(lateCounts, coffRows) {
return `
<div style="display:flex;flex-wrap:wrap;gap:2rem;margin-top:2rem;">
<div style="flex:1;min-width:320px;">
<h3 style="color:#2980b9;">Late Arrivals Summary</h3>
<table style="margin-top:1rem;max-width:500px;">
<thead>
<tr>
<th>Employee ID</th>
<th>Employee Name</th>
<th>Number of Lates</th>
</tr>
</thead>
<tbody>
${
Object.keys(lateCounts).length === 0
? `<tr><td colspan="3" style="text-align:center;color:#888;">No late records</td></tr>`
: Object.entries(lateCounts).map(([key, count]) => {
const [empId, empName] = key.split("|");
return `<tr><td>${empId}</td><td>${empName}</td><td>${count}</td></tr>`;
}).join("")
}
</tbody>
</table>
</div>
<div style="flex:1;min-width:320px;">
<h3 style="color:#27ae60;">COFF (Compensatory Off) Earned</h3>
<table style="margin-top:1rem;max-width:600px;">
<thead>
<tr>
<th>Employee ID</th>
<th>Employee Name</th>
<th>Total Extra Hours</th>
<th>COFF Days Earned</th>
</tr>
</thead>
<tbody>
${
coffRows ||
`<tr><td colspan="4" style="text-align:center;color:#888;">No COFF earned</td></tr>`
}
</tbody>
</table>
</div>
</div>
`;
}

// Main attendance panel function
function attendancePanel() {
// Calculate late arrivals and COFF
const lateCounts = calculateLateArrivals();
const coffRows = calculateCOFF();

// Create panel header
const panelHeader = `
<div style="background:linear-gradient(90deg,#223043 80%,#2980b9 100%);color:#fff;padding:1.2rem 2rem 1rem 2rem;border-radius:12px 12px 0 0;box-shadow:0 2px 12px rgba(44,62,80,0.10);display:flex;align-items:center;gap:1rem;">
<span style="font-size:2rem;vertical-align:middle;">&#128197;</span>
<div>
<h1 style="margin:0;font-size:1.6rem;">Attendance Tracking <span style="font-size:1rem;color:#bfc9d1;">(HR Admin)</span></h1>
<div style="font-size:1.05rem;margin-top:0.2rem;">Add, edit, and analyze employee attendance</div>
</div>
</div>
`;

// Combine all sections
return `
${panelHeader}
${createAttendanceForm()}
${createActionButtons()}
${createAttendanceTable()}
${createSummaryTables(lateCounts, coffRows)}
`;
}

function leavePanel() {
    // Quick stats
    const total = leaves.length;
    const pending = leaves.filter(l => l.status === "Pending").length;
    const approved = leaves.filter(l => l.status === "Approved").length;
    const rejected = leaves.filter(l => l.status === "Rejected").length;

    // Helper function to calculate days between two dates
    function calculateDays(fromDate, toDate) {
        if (!fromDate || !toDate) return 0;
        const start = new Date(fromDate);
        const end = new Date(toDate);
        return Math.floor((end - start) / (1000 * 60 * 60 * 24)) + 1;
    }

    // Helper function to calculate approved days
    function calculateApprovedDays(status, totalDays) {
        if (status === "Approved") return totalDays;
        return 0;
    }

    return `
        <div style="background:linear-gradient(90deg,#223043 80%,#2980b9 100%);color:#fff;padding:1.2rem 2rem 1rem 2rem;border-radius:12px 12px 0 0;box-shadow:0 2px 12px rgba(44,62,80,0.10);display:flex;align-items:center;gap:1rem;">
            <span style="font-size:2rem;vertical-align:middle;">&#128188;</span>
            <div>
                <h1 style="margin:0;font-size:1.6rem;">Leave Management <span style="font-size:1rem;color:#bfc9d1;">(HR Admin)</span></h1>
                <div style="font-size:1.05rem;margin-top:0.2rem;">Manage, approve, and track employee leaves</div>
            </div>
            <div style="margin-left:auto;display:flex;gap:1.5rem;">
                <div><span style="font-weight:bold;">Total:</span> ${total}</div>
                <div><span style="background:#f39c12;color:#fff;padding:2px 10px;border-radius:12px;">Pending: ${pending}</span></div>
                <div><span style="background:#27ae60;color:#fff;padding:2px 10px;border-radius:12px;">Approved: ${approved}</span></div>
                <div><span style="background:#e74c3c;color:#fff;padding:2px 10px;border-radius:12px;">Rejected: ${rejected}</span></div>
            </div>
        </div>
        <div style="background:#fff;padding:2rem 1.5rem 1.5rem 1.5rem;border-radius:0 0 12px 12px;box-shadow:0 4px 24px rgba(44,62,80,0.10);margin-bottom:2rem;">
            <form id="addLeaveForm" autocomplete="off" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:1rem;align-items:end;">
                <div>
                    <label for="leaveEmpId" style="font-weight:bold;">Employee ID</label>
                    <input type="text" id="leaveEmpId" placeholder="Employee ID" list="empIdList" required>
                    <datalist id="empIdList"></datalist>
                </div>
                <div>
                    <label for="leaveEmp" style="font-weight:bold;">Employee Name</label>
                    <input type="text" id="leaveEmp" placeholder="Employee Name" list="empNameList" required>
                    <datalist id="empNameList"></datalist>
                </div>
                <div>
                    <label for="leaveType" style="font-weight:bold;">Leave Type</label>
                    <select id="leaveType" required>
                        <option value="">Leave Type</option>
                        <option>Sick</option>
                        <option>Casual</option>
                        <option>Earned</option>
                        <option>Unpaid</option>
                    </select>
                </div>
                <div>
                    <label for="leaveStatus" style="font-weight:bold;">Status</label>
                    <select id="leaveStatus" required>
                        <option value="">Status</option>
                        <option>Pending</option>
                        <option>Approved</option>
                        <option>Rejected</option>
                    </select>
                </div>
                <div>
                    <label for="leaveFrom" style="font-weight:bold;">From</label>
                    <input type="date" id="leaveFrom" required>
                </div>
                <div>
                    <label for="leaveTo" style="font-weight:bold;">To</label>
                    <input type="date" id="leaveTo" required>
                </div>
                <div>
                    <label for="leaveTotalDays" style="font-weight:bold;">Total Days</label>
                    <input type="number" id="leaveTotalDays" placeholder="Total Days" readonly>
                </div>
                <div>
                    <label for="leaveApprovedDays" style="font-weight:bold;">Approved Days</label>
                    <input type="number" id="leaveApprovedDays" placeholder="Approved Days" readonly>
                </div>
                <div>
                    <label for="leaveDesc" style="font-weight:bold;">Description</label>
                    <input type="text" id="leaveDesc" placeholder="Description">
                </div>
                <div>
                    <label for="leaveApprovedBy" style="font-weight:bold;">Approved By</label>
                    <select id="leaveApprovedBy" required>
                        <option value="">Approved By</option>
                        <option>Managing Director</option>
                        <option>Technical Director</option>
                        <option>Project Manager</option>
                        <option>HR General Manager</option>
                        <option>Manager Commercial</option>
                    </select>
                </div>
                <div style="grid-column:1/-1;text-align:right;">
                    <button type="submit" style="width:160px;">Add Leave</button>
                </div>
            </form>
        </div>
        <input class="search-bar" id="leaveSearch" placeholder="Search leaves...">
        <button class="export-btn" id="leaveExport">Export CSV</button>
        <div style="overflow-x:auto;">
            <table style="min-width:1300px;">
                <thead>
                    <tr>
                        <th data-col="employeeId">Employee ID &#8597;</th>
                        <th data-col="employee">Employee &#8597;</th>
                        <th data-col="type">Type &#8597;</th>
                        <th data-col="status">Status &#8597;</th>
                        <th data-col="from">From &#8597;</th>
                        <th data-col="to">To &#8597;</th>
                        <th data-col="totalDays">Total Days &#8597;</th>
                        <th data-col="approvedDays">Approved Days &#8597;</th>
                        <th data-col="description">Description &#8597;</th>
                        <th data-col="approvedBy">Approved By &#8597;</th>
                        <th>Action</th>
                    </tr>
                </thead>
                <tbody id="leaveTableBody"></tbody>
            </table>
        </div>
        <style>
            #leaveTableBody td:nth-child(4) .badge-pending { background:#f39c12;color:#fff;padding:2px 10px;border-radius:12px;font-size:0.98em;}
            #leaveTableBody td:nth-child(4) .badge-approved { background:#27ae60;color:#fff;padding:2px 10px;border-radius:12px;font-size:0.98em;}
            #leaveTableBody td:nth-child(4) .badge-rejected { background:#e74c3c;color:#fff;padding:2px 10px;border-radius:12px;font-size:0.98em;}
        </style>
    `;
}

function payrollPanel() {
    // Load leaves data
    let leaves = JSON.parse(localStorage.getItem('hrms_leaves') || '[]');
    
    // Helper function to get approved leave days
    function getApprovedLeaveDays(employeeId, fromDate, toDate) {
        const start = new Date(fromDate);
        const end = new Date(toDate);
        let leaveDays = 0;

        leaves.forEach(leave => {
            if (leave.employeeId === employeeId && leave.status === "Approved") {
                const leaveStart = new Date(leave.from);
                const leaveEnd = new Date(leave.to);

                // Check if the leave period overlaps with the payroll cycle
                if (leaveEnd >= start && leaveStart <= end) {
                    // Calculate the overlapping days
                    const overlapStart = new Date(Math.max(leaveStart, start));
                    const overlapEnd = new Date(Math.min(leaveEnd, end));
                    const days = Math.floor((overlapEnd - overlapStart) / (1000 * 60 * 60 * 24)) + 1;
                    leaveDays += days;
                }
            }
        });

        return leaveDays;
    }

    // Summary calculations
    let empId = "";
    let daysInCycle = "";
    let presentDays = "";
    let absentDays = "";
    let leaveDays = "";
    let basic = "";
    let allowances = "";
    let gross = "";
    let earnedBasic = "";
    let earnedAllowances = "";
    let earnedGross = "";
    let pf = "";
    let esi = "";

    // If payroll records exist, use the latest record for summary
    if (payroll.length > 0) {
        const last = payroll[payroll.length - 1];
        const fromDate = last.fromDate || "";
        const toDate = last.toDate || "";
        empId = last.employeeId || "";
        basic = last.basic || "";
        allowances = last.allowances || "";
        gross = last.gross || "";
        pf = last.pf || 0;
        esi = last.esi || 0;
        daysInCycle = last.daysInCycle || "";
        presentDays = last.presentDays || "";
        absentDays = last.absentDays || "";
        leaveDays = last.leaveDays || "";

        if (fromDate && toDate && empId) {
            // Calculate earned salary = prorated - deductions
            earnedBasic = basic && daysInCycle ? (((basic * presentDays) / daysInCycle) - pf).toFixed(2) : "";
            earnedAllowances = allowances && daysInCycle ? (((allowances * presentDays) / daysInCycle) - esi).toFixed(2) : "";
            earnedGross = gross && daysInCycle ? (((gross * presentDays) / daysInCycle) - pf - esi).toFixed(2) : "";
        }
    }

    return `
        <!-- Header -->
        <div style="background:linear-gradient(90deg,#223043 80%,#2980b9 100%);
        color:#fff;padding:1.2rem 2rem;border-radius:12px 12px 0 0;
        box-shadow:0 2px 12px rgba(44,62,80,0.10);display:flex;align-items:center;gap:1rem;">
            <span style="font-size:2rem;">&#128181;</span>
            <div>
                <h1 style="margin:0;font-size:1.6rem;">Payroll Management
                <span style="font-size:1rem;color:#bfc9d1;">(HR Admin)</span>
                </h1>
                <div style="font-size:1.05rem;margin-top:0.2rem;">
                Manage, calculate, and track employee payroll
                </div>
            </div>
        </div>

        <!-- Summary -->
        <div style="display:flex;gap:2rem;align-items:center;background:#fff;
        padding:1rem 2rem;border-radius:0 0 12px 12px;
        box-shadow:0 2px 12px rgba(44,62,80,0.07);margin-bottom:0.5rem;flex-wrap:wrap;">
            <div><b>Days in Cycle:</b> <span id="payrollDaysInMonth">${daysInCycle || "-"}</span></div>
            <div style="color:#27ae60;"><b>Present Days:</b> <span id="payrollPresentDays">${presentDays || "-"}</span></div>
            <div style="color:#f39c12;"><b>Leave Days:</b> <span id="payrollLeaveDays">${leaveDays || "-"}</span></div>
            <div style="color:#e74c3c;"><b>Absent Days:</b> <span id="payrollAbsentDays">${absentDays || "-"}</span></div>
            <div style="color:#2980b9;"><b>Basic:</b> <span id="payrollBasic">${basic || "-"}</span></div>
            <div style="color:#2980b9;"><b>Allowances:</b> <span id="payrollAllowances">${allowances || "-"}</span></div>
            <div style="color:#2980b9;"><b>Gross:</b> <span id="payrollGross">${gross || "-"}</span></div>
            <div style="color:#27ae60;"><b>Earned Basic:</b> <span id="payrollEarnedBasic">${earnedBasic || "-"}</span></div>
            <div style="color:#27ae60;"><b>Earned Allowances:</b> <span id="payrollEarnedAllowances">${earnedAllowances || "-"}</span></div>
            <div style="color:#27ae60;"><b>Earned Gross:</b> <span id="payrollEarnedGross">${earnedGross || "-"}</span></div>
        </div>

        <!-- Payroll Form -->
        <form id="addPayrollForm" autocomplete="off"
        style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));
        gap:1rem;align-items:end;background:#fff;padding:2rem;
        border-radius:0 0 12px 12px;box-shadow:0 4px 24px rgba(44,62,80,0.10);
        margin-bottom:2rem;">
            <div>
                <label for="payEmpId"><b>Employee ID</b></label>
                <input type="text" id="payEmpId" placeholder="Employee ID" required>
            </div>
            <div>
                <label for="payEmp"><b>Employee Name</b></label>
                <input type="text" id="payEmp" placeholder="Employee Name" required>
            </div>
            <div>
                <label for="payFrom"><b>From Date</b></label>
                <input type="date" id="payFrom" required>
            </div>
            <div>
                <label for="payTo"><b>To Date</b></label>
                <input type="date" id="payTo" required>
            </div>
            <div>
                <label for="payBasic"><b>Basic Salary</b></label>
                <input type="number" id="payBasic" placeholder="Basic Salary" required>
            </div>
            <div>
                <label for="payAllow"><b>Allowances</b></label>
                <input type="number" id="payAllow" placeholder="Allowances" required>
            </div>
            <div>
                <label for="payGross"><b>Gross Salary</b></label>
                <input type="number" id="payGross" placeholder="Gross Salary" required readonly>
            </div>
            <div>
                <label for="payPF"><b>PF (12%)</b></label>
                <select id="payPFSelect" style="width:100%;margin-bottom:0.3rem;">
                    <option value="auto">Auto Calculate</option>
                    <option value="none">Not Applicable</option>
                    <option value="manual">Manual Entry</option>
                </select>
                <input type="number" id="payPF" placeholder="PF Amount" step="0.01" required readonly>
            </div>
            <div>
                <label for="payESI"><b>ESI (0.75%)</b></label>
                <select id="payESISelect" style="width:100%;margin-bottom:0.3rem;">
                    <option value="auto">Auto Calculate</option>
                    <option value="none">Not Applicable</option>
                    <option value="manual">Manual Entry</option>
                </select>
                <input type="number" id="payESI" placeholder="ESI Amount" step="0.01" required readonly>
            </div>
            <div>
                <label for="payTDS"><b>TDS</b></label>
                <select id="payTDSSelect" style="width:100%;margin-bottom:0.3rem;">
                    <option value="none">Not Applicable</option>
                    <option value="manual">Manual Entry</option>
                </select>
                <input type="number" id="payTDS" placeholder="TDS Amount" step="0.01" readonly>
            </div>
            <div>
                <label for="payProfessionalTax"><b>Professional Tax</b></label>
                <input type="number" id="payProfessionalTax" placeholder="Professional Tax" step="0.01">
            </div>
            <div>
                <label for="payAdvanced"><b>Advances</b></label>
                <input type="number" id="payAdvanced" placeholder="Advances" step="0.01">
            </div>
            <div>
                <label for="payLeaveDays"><b>Leave Days (Auto)</b></label>
                <input type="number" id="payLeaveDays" placeholder="Leave Days" min="0" step="1" readonly>
            </div>
            <div>
                <label for="payAbsentDays"><b>No. Days Absent</b></label>
                <select id="payAbsentDaysSelect" style="width:100%;margin-bottom:0.3rem;">
                    <option value="auto">Auto Detect</option>
                    <option value="none">Not Applicable</option>
                    <option value="manual">Manual Entered</option>
                </select>
                <input type="number" id="payAbsentDays" placeholder="Days Absent" min="0" step="1" readonly>
            </div>
            <div>
                <label for="payDeduct"><b>Total Deductions</b></label>
                <input type="number" id="payDeduct" placeholder="Total Deductions" required readonly>
            </div>
            <div>
                <label for="payNetAuto"><b>Net Pay</b></label>
                <input type="number" id="payNetAuto" placeholder="Net Pay" required readonly>
            </div>
            <div style="grid-column:1/-1;text-align:right;">
                <button type="submit" style="width:160px;">Add Payroll</button>
                <button type="button" id="autoPayrollAll"
                style="width:220px;background:#27ae60;margin-left:1rem;">Auto Payroll All Employees</button>
                <button type="button" id="resetPayroll"
                style="width:160px;background:#e74c3c;margin-left:1rem;">Reset Payroll</button>
            </div>
        </form>

        <!-- Table -->
        <div style="display:flex;justify-content:space-between;align-items:center;margin:1rem 0;">
            <input class="search-bar" id="payrollSearch" placeholder="Search payroll..." style="max-width:320px;">
            <button class="export-btn" id="payrollExport">Export CSV</button>
        </div>
        <div style="overflow-x:auto;">
            <table style="min-width:1700px;">
                <thead>
                    <tr style="background:#eaf1fb;">
                        <th data-col="employeeId">Employee ID &#8597;</th>
                        <th data-col="employee">Employee &#8597;</th>
                        <th colspan="3" style="text-align:center;background:#eaf1fb;">Basic + Allowances = Gross</th>
                        <th colspan="3" style="text-align:center;background:#eaf1fb;">Earned (Basic / Allowance / Gross) &#8597;</th>
                        <th data-col="daysInCycle">Days in Cycle &#8597;</th>
                        <th data-col="presentDays">Present Days &#8597;</th>
                        <th data-col="leaveDays">Leave Days &#8597;</th>
                        <th data-col="absentDays">Absent Days &#8597;</th>
                        <th data-col="pf">PF &#8597;</th>
                        <th data-col="esi">ESI &#8597;</th>
                        <th data-col="tds">TDS &#8597;</th>
                        <th data-col="professionalTax">Professional Tax &#8597;</th>
                        <th data-col="advanced">Advanced &#8597;</th>
                        <th data-col="deductions">Total Deductions &#8597;</th>
                        <th data-col="net">Net Pay &#8597;</th>
                        <th>Action</th>
                    </tr>
                </thead>
                <tbody id="payrollTableBody"></tbody>
            </table>
        </div>
    `;
}

function performancePanel() {
return `
<div style="background:linear-gradient(90deg,#223043 80%,#2980b9 100%);color:#fff;padding:1.2rem 2rem 1rem 2rem;border-radius:12px 12px 0 0;box-shadow:0 2px 12px rgba(44,62,80,0.10);display:flex;align-items:center;gap:1rem;">
<span style="font-size:2rem;vertical-align:middle;">&#11088;</span>
<div>
<h1 style="margin:0;font-size:1.6rem;">Appraisal & Performance <span style="font-size:1rem;color:#bfc9d1;">(HR Admin)</span></h1>
<div style="font-size:1.05rem;margin-top:0.2rem;">Add, review, and analyze employee appraisals</div>
</div>
</div>
<div style="background:#fff;padding:2rem 1.5rem 1.5rem 1.5rem;border-radius:0 0 12px 12px;box-shadow:0 4px 24px rgba(44,62,80,0.10);margin-bottom:2rem;">
<form id="addPerfForm" autocomplete="off" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:1rem;align-items:end;">
<div>
<label for="perfEmpId" style="font-weight:bold;">Employee ID</label>
<input type="text" id="perfEmpId" placeholder="Employee ID" required>
</div>
<div>
<label for="perfEmp" style="font-weight:bold;">Employee Name</label>
<input type="text" id="perfEmp" placeholder="Employee Name" required>
</div>
<div>
<label for="perfPeriod" style="font-weight:bold;">Period</label>
<input type="month" id="perfPeriod" required>
</div>
<div>
<label for="perfScore" style="font-weight:bold;">Score (1-10)</label>
<input type="number" id="perfScore" placeholder="Score (1-10)" min="1" max="10" required>
</div>
<div>
<label for="perfReviewer" style="font-weight:bold;">Reviewer</label>
<input type="text" id="perfReviewer" placeholder="Reviewer" required>
</div>
<div>
<label for="perfRemarks" style="font-weight:bold;">Remarks</label>
<input type="text" id="perfRemarks" placeholder="Remarks">
</div>
<div style="grid-column:1/-1;text-align:right;">
<button type="submit" style="width:160px;">Add Appraisal</button>
</div>
</form>
</div>
<div style="display:flex;flex-wrap:wrap;gap:0.2rem 0.3rem;align-items:center;margin:0 0 0.5rem 0;">
<input class="search-bar" id="perfSearch" placeholder="Search appraisals..." style="flex:1 1 100px;max-width:180px;">
<button class="export-btn" id="perfExport" style="flex:0 0 90px;">Export CSV</button>
</div>
<div style="overflow-x:auto;">
<table style="min-width:900px;">
<thead>
<tr>
<th data-col="employeeId">Employee ID &#8597;</th>
<th data-col="employee">Employee &#8597;</th>
<th data-col="period">Period &#8597;</th>
<th data-col="score">Score &#8597;</th>
<th data-col="reviewer">Reviewer &#8597;</th>
<th data-col="remarks">Remarks &#8597;</th>
<th>Action</th>
</tr>
</thead>
<tbody id="perfTableBody"></tbody>
</table>
</div>
`;
}

function documentsPanel() {
return `
<div style="background:linear-gradient(90deg,#223043 80%,#2980b9 100%);
color:#fff;padding:1.2rem 2rem 1rem 2rem;
border-radius:12px 12px 0 0;
box-shadow:0 2px 12px rgba(44,62,80,0.10);
display:flex;align-items:center;gap:1rem;">
<span style="font-size:2rem;">&#128452;</span>
<div>
<h1 style="margin:0;font-size:1.6rem;">
Document Storage <span style="font-size:1rem;color:#bfc9d1;">(HR Admin)</span>
</h1>
<div style="font-size:1.05rem;margin-top:0.2rem;">
Upload, manage, and search employee documents
</div>
</div>
</div>

<div style="background:#fff;padding:2rem 1.5rem 1.5rem 1.5rem;
border-radius:0 0 12px 12px;
box-shadow:0 4px 24px rgba(44,62,80,0.10);
margin-bottom:2rem;">
<form id="addDocForm" autocomplete="off"
style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));
gap:1rem;align-items:end;">

<!-- Employee ID -->
<div>
<label for="docEmpId" style="font-weight:bold;">Employee ID</label>
<input type="text" id="docEmpId" list="docEmpIdList" placeholder="Enter/Select ID" required>
<datalist id="docEmpIdList"></datalist>
</div>

<!-- Employee Name -->
<div>
<label for="docEmp" style="font-weight:bold;">Employee Name</label>
<input type="text" id="docEmp" list="docEmpList" placeholder="Enter/Select Name" required>
<datalist id="docEmpList"></datalist>
</div>

<!-- Document Type -->
<div>
<label for="docType" style="font-weight:bold;">Document Type</label>
<input type="text" id="docType" placeholder="Resume, ID Proof, etc." required>
</div>

<!-- Document Name -->
<div>
<label for="docName" style="font-weight:bold;">Document Name</label>
<input type="text" id="docName" placeholder="Document Name" required>
</div>

<!-- Date -->
<div>
<label for="docDate" style="font-weight:bold;">Date</label>
<input type="date" id="docDate" required>
</div>

<!-- Document Link -->
<div>
<label for="docLink" style="font-weight:bold;">Document Link or Path</label>
<input type="url" id="docLink" placeholder="Document Link or Path" required>
</div>

<!-- Submit Button -->
<div style="grid-column:1/-1;text-align:right;">
<button type="submit" style="width:160px;">Add Document</button>
</div>
</form>
</div>

<!-- Search & Export -->
<div style="display:flex;flex-wrap:wrap;gap:0.2rem 0.3rem;align-items:center;margin:0 0 0.5rem 0;">
<input class="search-bar" id="docSearch" placeholder="Search documents..." style="flex:1 1 100px;max-width:180px;">
<button class="export-btn" id="docExport" style="flex:0 0 90px;">Export CSV</button>
</div>

<!-- Document Table -->
<div style="overflow-x:auto;">
<table style="min-width:900px;">
<thead>
<tr>
<th data-col="employeeId">Employee ID &#8597;</th>
<th data-col="employee">Employee &#8597;</th>
<th data-col="type">Type &#8597;</th>
<th data-col="name">Name &#8597;</th>
<th data-col="date">Date &#8597;</th>
<th data-col="link">Link &#8597;</th>
<th>Action</th>
</tr>
</thead>
<tbody id="docTableBody"></tbody>
</table>
</div>
`;
}

function reportsPanel() {
// Calculate stats
const empCount = employees.length;
const attCount = attendance.length;
const presentCount = attendance.filter(a => a.status === "Present").length;
const absentCount = attendance.filter(a => a.status === "Absent").length;
const lateCount = attendance.filter(a => a.status === "Late").length;
const leaveCount = leaves.length;
const approvedLeaves = leaves.filter(l => l.status === "Approved").length;
const pendingLeaves = leaves.filter(l => l.status === "Pending").length;
const payrollCount = (typeof payroll !== "undefined") ? payroll.length : 0;
const totalPayroll = (typeof payroll !== "undefined") ? payroll.reduce((sum, p) => sum + (p.basic + p.allowances - p.deductions), 0) : 0;

// Simple bar chart for attendance
const attMax = Math.max(presentCount, absentCount, lateCount, 1);
function bar(val, color) {
return `<div style="background:${color || '#2980b9'};height:18px;width:${Math.round(val/attMax*200)}px;display:inline-block;border-radius:6px;"></div> <span style="font-weight:bold;">${val}</span>`;
}

// Simple pie chart for leave status (SVG)
function leavePie() {
const total = approvedLeaves + pendingLeaves;
if (total === 0) return '';
const approvedAngle = (approvedLeaves / total) * 360;
const pendingAngle = (pendingLeaves / total) * 360;
// Pie chart with two slices
return `<svg width="60" height="60" viewBox="0 0 32 32">
<circle r="16" cx="16" cy="16" fill="#27ae60" stroke="#27ae60" stroke-width="32" stroke-dasharray="${approvedAngle} 360" transform="rotate(-90 16 16)" />
<circle r="16" cx="16" cy="16" fill="transparent" stroke="#f39c12" stroke-width="32" stroke-dasharray="${pendingAngle} 360" transform="rotate(${approvedAngle-90} 16 16)" />
</svg>
<span style="font-size:12px;">Approved: ${approvedLeaves}, Pending: ${pendingLeaves}</span>`;
}

return `
<div style="background:linear-gradient(90deg,#223043 80%,#2980b9 100%);color:#fff;padding:1.2rem 2rem 1rem 2rem;border-radius:12px 12px 0 0;box-shadow:0 2px 12px rgba(44,62,80,0.10);display:flex;align-items:center;gap:1rem;">
<span style="font-size:2rem;vertical-align:middle;">&#128202;</span>
<div>
<h1 style="margin:0;font-size:1.6rem;">Reports & Analytics <span style="font-size:1rem;color:#bfc9d1;">(HR Admin)</span></h1>
<div style="font-size:1.05rem;margin-top:0.2rem;">Visualize HRMS data and trends</div>
</div>
</div>
<div style="display:flex;flex-wrap:wrap;gap:2rem 2.5rem;background:#fff;padding:2.2rem 2rem 1.5rem 2rem;border-radius:0 0 12px 12px;box-shadow:0 4px 24px rgba(44,62,80,0.10);margin-bottom:2rem;">
<div style="flex:1;min-width:220px;box-shadow:0 2px 12px #2980b91a;border-radius:10px;padding:1.2rem 1rem;background:linear-gradient(90deg,#eaf1fb 80%,#f4f6f8 100%);">
<h3 style="color:#223043;">Employee Summary</h3>
<p style="font-size:1.15rem;">Total Employees: <b style="color:#2980b9;font-size:1.3rem;">${empCount}</b></p>
</div>
<div style="flex:1;min-width:220px;box-shadow:0 2px 12px #2980b91a;border-radius:10px;padding:1.2rem 1rem;background:linear-gradient(90deg,#eaf1fb 80%,#f4f6f8 100%);">
<h3 style="color:#223043;">Attendance Summary</h3>
<p style="font-size:1.08rem;">Total Records: <b>${attCount}</b></p>
<div>Present: ${bar(presentCount, "#27ae60")}</div>
<div>Absent: ${bar(absentCount, "#e74c3c")}</div>
<div>Late: ${bar(lateCount, "#f39c12")}</div>
</div>
<div style="flex:1;min-width:220px;box-shadow:0 2px 12px #2980b91a;border-radius:10px;padding:1.2rem 1rem;background:linear-gradient(90deg,#eaf1fb 80%,#f4f6f8 100%);">
<h3 style="color:#223043;">Payroll Summary</h3>
<p style="font-size:1.08rem;">Total Payroll Records: <b>${payrollCount}</b></p>
<p style="font-size:1.08rem;">Total Net Paid: <b style="color:#27ae60;">₹${totalPayroll.toLocaleString()}</b></p>
</div>
<div style="flex:1;min-width:220px;box-shadow:0 2px 12px #2980b91a;border-radius:10px;padding:1.2rem 1rem;background:linear-gradient(90deg,#eaf1fb 80%,#f4f6f8 100%);">
<h3 style="color:#223043;">Leave Summary</h3>
<p style="font-size:1.08rem;">Total Leaves: <b>${leaveCount}</b></p>
<div style="margin-top:0.5rem;">${leavePie()}</div>
</div>
</div>
<div style="padding:1.5rem 2rem;">
<hr style="margin:2rem 0 1.5rem 0;border:0;border-top:1.5px solid #eaf1fb;">
<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(340px,1fr));gap:2.5rem;">
<div style="background:#fff;border-radius:12px;box-shadow:0 2px 12px #2980b91a;padding:1.2rem 1rem;">
<h3 style="color:#2980b9;">Recent Attendance</h3>
<table style="width:100%;margin-top:0.7rem;">
<thead>
<tr>
<th>Employee</th>
<th>Date</th>
<th>Status</th>
<th>Description</th>
</tr>
</thead>
<tbody>
${attendance.slice(-5).reverse().map(a=>`
<tr>
<td>${a.employee || ""}</td>
<td>${a.date || ""}</td>
<td><span class="badge-${(a.status||"").toLowerCase()}">${a.status || ""}</span></td>
<td>${a.description||""}</td>
</tr>
`).join("")}
</tbody>
</table>
</div>
<div style="background:#fff;border-radius:12px;box-shadow:0 2px 12px #2980b91a;padding:1.2rem 1rem;">
<h3 style="color:#2980b9;">Recent Payroll</h3>
<table style="width:100%;margin-top:0.7rem;">
<thead>
<tr>
<th>Employee</th>
<th>Month</th>
<th>Net Pay</th>
</tr>
</thead>
<tbody>
${(typeof payroll !== "undefined" ? payroll.slice(-5).reverse().map(p=>`
<tr>
<td>${p.employee || ""}</td>
<td>${p.month || ""}</td>
<td><b style="color:#27ae60;">₹${((p.basic || 0) + (p.allowances || 0) - (p.deductions || 0)).toLocaleString()}</b></td>
</tr>
`).join("") : "")}
</tbody>
</table>
</div>
<div style="background:#fff;border-radius:12px;box-shadow:0 2px 12px #2980b91a;padding:1.2rem 1rem;">
<h3 style="color:#2980b9;">Recent Leaves</h3>
<table style="width:100%;margin-top:0.7rem;">
<thead>
<tr>
<th>Employee</th>
<th>Type</th>
<th>Status</th>
<th>From</th>
<th>To</th>
</tr>
</thead>
<tbody>
${leaves.slice(-5).reverse().map(l=>`
<tr>
<td>${l.employee}</td>
<td>${l.type}</td>
<td><span class="badge-${(l.status||"").toLowerCase()}">${l.status}</span></td>
<td>${l.from}</td>
<td>${l.to}</td>
</tr>
`).join("")}
</tbody>
</table>
</div>
</div>
</div>
`;
}

function payslipsPanel() {
// Prepare payslip data (ensure window.payslips is an array of payslip objects)
const payslips = window.payslips || [];

// Employee dropdown for filtering
const empOptions = employees.map(e => `<option value="${e.id}">${e.id} - ${e.name}</option>`).join('');

return `
<div style="background:linear-gradient(90deg,#223043 80%,#2980b9 100%);color:#fff;padding:1.2rem 2rem 1rem 2rem;border-radius:12px 12px 0 0;box-shadow:0 2px 12px rgba(44,62,80,0.10);display:flex;align-items:center;gap:1rem;">
<span style="font-size:2rem;vertical-align:middle;">&#128179;</span>
<div>
<h1 style="margin:0;font-size:1.6rem;">Payslips <span style="font-size:1rem;color:#bfc9d1;">(HR Admin)</span></h1>
<div style="font-size:1.05rem;margin-top:0.2rem;">View, filter, and download employee payslips</div>
</div>
</div>
<div style="background:#fff;padding:1.5rem 1.5rem 1rem 1.5rem;border-radius:0 0 12px 12px;box-shadow:0 4px 24px rgba(44,62,80,0.10);margin-bottom:2rem;">
<form id="payslipFilterForm" style="display:flex;gap:1.5rem;align-items:end;flex-wrap:wrap;">
<div>
<label for="payslipEmp" style="font-weight:bold;">Employee</label>
<select id="payslipEmp" style="min-width:180px;">
<option value="">All Employees</option>
${empOptions}
</select>
</div>
<div>
<label for="payslipMonth" style="font-weight:bold;">Month</label>
<input type="month" id="payslipMonth">
</div>
<div>
<button type="submit" class="export-btn" style="margin-top:1.6rem;">Filter</button>
</div>
<div style="margin-left:auto;">
<button type="button" class="export-btn" id="payslipExport">Export All Payslips (CSV)</button>
</div>
</form>
</div>
<div style="overflow-x:auto;">
<table style="min-width:1000px;">
<thead>
<tr>
<th>Employee ID</th>
<th>Name</th>
<th>Month</th>
<th>Earned Basic</th>
<th>Earned Allowances</th>
<th>Earned Gross</th>
<th>Deductions</th>
<th>Net Pay</th>
<th>Present Days</th>
<th>Absent Days</th>
<th>Days in Month</th>
<th>Department</th>
<th>Advance</th>
<th>View</th>
</tr>
</thead>
<tbody id="payslipsTableBody"></tbody>
</table>
</div>
<div id="payslipModal" style="display:none;position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(34,48,67,0.18);z-index:9999;align-items:center;justify-content:center;">
<div id="payslipModalContent" style="background:#fff;padding:2.5rem 2.5rem 2rem 2.5rem;border-radius:16px;box-shadow:0 8px 32px rgba(44,62,80,0.18);max-width:480px;width:95%;position:relative;">
<button id="closePayslipModal" style="position:absolute;top:12px;right:18px;background:none;border:none;font-size:1.5rem;color:#e74c3c;cursor:pointer;">&times;</button>
<div id="payslipDetails"></div>
<div style="margin-top:1.5rem;text-align:right;">
<button id="printPayslipBtn" class="export-btn" style="margin-right:1rem;">Print</button>
<button id="downloadPayslipBtn" class="export-btn">Download PDF</button>
</div>
</div>
</div>
`;
}

function holidaysPanel() {
return `
<h1>Holiday Scheduling</h1>
<form id="addHolidayForm" autocomplete="off">
<input type="date" id="holidayDate" placeholder="Date" required>
<input type="text" id="holidayName" placeholder="Holiday Name" required>
<input type="text" id="holidayDesc" placeholder="Description">
<button type="submit">Add Holiday</button>
</form>
<input class="search-bar" id="holidaySearch" placeholder="Search holidays...">
<button class="export-btn" id="holidayExport">Export CSV</button>
<div style="overflow-x:auto;">
<table style="min-width:600px;">
<thead>
<tr>
<th data-col="date">Date &#8597;</th>
<th data-col="name">Holiday Name &#8597;</th>
<th data-col="desc">Description &#8597;</th>
<th>Action</th>
</tr>
</thead>
<tbody id="holidayTableBody"></tbody>
</table>
</div>
`;
}

function logreportPanel() {
// For demonstration, we'll use a simple in-memory log array.
// In a real app, this would be loaded from persistent storage or generated from user actions.
if (!window.hrmsLogs) window.hrmsLogs = [
{ timestamp: new Date().toISOString(), user: "admin", action: "Login", details: "Logged in to HRMS" },
{ timestamp: new Date().toISOString(), user: "admin", action: "Viewed", details: "Viewed Employee Database" }
];

// Render log table rows
const logRows = window.hrmsLogs.slice().reverse().map(log =>
`<tr>
<td>${log.timestamp.replace("T", " ").slice(0, 19)}</td>
<td>${log.user}</td>
<td>${log.action}</td>
<td>${log.details}</td>
</tr>`
).join("");

return `
<div style="background:linear-gradient(90deg,#223043 80%,#2980b9 100%);color:#fff;padding:1.2rem 2rem 1rem 2rem;border-radius:12px 12px 0 0;box-shadow:0 2px 12px rgba(44,62,80,0.10);display:flex;align-items:center;gap:1rem;">
<span style="font-size:2rem;vertical-align:middle;">&#128221;</span>
<div>
<h1 style="margin:0;font-size:1.6rem;">Log Report (Footprints) <span style="font-size:1rem;color:#bfc9d1;">(HR Admin)</span></h1>
<div style="font-size:1.05rem;margin-top:0.2rem;">View user activity and system logs</div>
</div>
</div>
<div style="background:#fff;padding:2rem 1.5rem 1.5rem 1.5rem;border-radius:0 0 12px 12px;box-shadow:0 4px 24px rgba(44,62,80,0.10);margin-bottom:2rem;">
<input class="search-bar" id="logSearch" placeholder="Search logs..." style="max-width:320px;">
<button class="export-btn" id="logExport" style="margin-left:1rem;">Export CSV</button>
<div style="overflow-x:auto;margin-top:1.2rem;">
<table style="min-width:900px;">
<thead>
<tr>
<th>Date & Time &#8597;</th>
<th>User &#8597;</th>
<th>Action &#8597;</th>
<th>Details &#8597;</th>
</tr>
</thead>
<tbody id="logTableBody">
${logRows || `<tr><td colspan="4" style="text-align:center;color:#888;">No logs found.</td></tr>`}
</tbody>
</table>
</div>
</div>
`;
}

// Panel rendering function
function renderPanel(panelKey) {
const panelContent = {
employee: employeePanel(),
attendance: attendancePanel(),
leave: leavePanel(),
payroll: payrollPanel(),
performance: performancePanel(),
documents: documentsPanel(),
reports: reportsPanel(),
payslips: payslipsPanel(),
holidays: holidaysPanel(),
logreport: logreportPanel()
};
document.getElementById('panel-content').innerHTML = panelContent[panelKey] || "Panel not found";
attachPanelEvents(panelKey);
}

// Attach events for the active panel
function attachPanelEvents(panelKey) {
// Employee Module
if (panelKey === "employee") {
    let sortCol = null, sortAsc = true;

    // --- Calculate COFF Days ---
    function getCoffDaysForEmp(empId, empName) {
        let totalExtra = 0;
        attendance.forEach(a => {
            if (
                a.employeeId === empId &&
                a.employee === empName &&
                a.extraHours &&
                !isNaN(a.extraHours) &&
                a.extraHours > 0
            ) totalExtra += parseFloat(a.extraHours);
        });
        return Math.floor(totalExtra / 8);
    }

    // --- Render Employee Table ---
    function renderTable(filter = "") {
        let data = employees.map((e, i) => ({ ...e, idx: i }));

        // Apply search filter
        if (filter) {
            const f = filter.toLowerCase();
            data = data.filter(e =>
                (e.id || "").toLowerCase().includes(f) ||
                (e.name || "").toLowerCase().includes(f) ||
                (e.department || "").toLowerCase().includes(f) ||
                (e.email || "").toLowerCase().includes(f) ||
                (e.mobile || "").toLowerCase().includes(f) ||
                (e.address || "").toLowerCase().includes(f) ||
                (e.doj || "").toLowerCase().includes(f) ||
                (e.doj1yr || "").toLowerCase().includes(f) ||
                (e.basicSalary || "").toString().includes(f) ||
                (e.allowances || "").toString().includes(f) ||
                (e.pfApplicable || "").toLowerCase().includes(f) ||
                (e.esiApplicable || "").toLowerCase().includes(f) ||
                (e.tdsApplicable || "").toLowerCase().includes(f) ||
                (e.casualLeave || "").toString().includes(f) ||
                (e.sickLeave || "").toString().includes(f) ||
                (e.paidLeave || "").toString().includes(f)
            );
        }

        // Apply sorting
        if (sortCol) {
            data.sort((a, b) => {
                if (a[sortCol] < b[sortCol]) return sortAsc ? -1 : 1;
                if (a[sortCol] > b[sortCol]) return sortAsc ? 1 : -1;
                return 0;
            });
        }

        const tbody = document.getElementById("empTableBody");
        tbody.innerHTML = "";

        data.forEach(e => {
            const coffDays = getCoffDaysForEmp(e.id, e.name);
            const totalLeaves = (+e.casualLeave || 0) + (+e.sickLeave || 0) + (+e.paidLeave || 0) + coffDays;
            e.COFF = coffDays;
            e.TotalLeaves = totalLeaves;

            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td>${e.id || ""}</td>
                <td>${e.name || ""}</td>
                <td>${e.department || ""}</td>
                <td>${e.email || ""}</td>
                <td>${e.mobile || ""}</td>
                <td>${e.address || ""}</td>
                <td>${e.doj || ""}</td>
                <td>${e.doj1yr || ""}</td>
                <td>${e.basicSalary || ""}</td>
                <td>${e.allowances || ""}</td>
                <td>${e.pfApplicable === "applicable" ? "Applicable" : (e.pfApplicable === "not_applicable" ? "Not Applicable" : "")}</td>
                <td>${e.esiApplicable === "applicable" ? "Applicable" : (e.esiApplicable === "not_applicable" ? "Not Applicable" : "")}</td>
                <td>${e.tdsApplicable === "applicable" ? "Applicable" : (e.tdsApplicable === "not_applicable" ? "Not Applicable" : "")}</td>
                <td>${e.casualLeave || 0}</td>
                <td>${e.sickLeave || 0}</td>
                <td>${e.paidLeave || 0}</td>
                <td>${coffDays}</td>
                <td>${totalLeaves}</td>
                <td>
                    <button class="edit-btn" data-idx="${e.idx}">Edit</button>
                    <button class="delete-btn" data-idx="${e.idx}">Delete</button>
                    <button class="increment-btn" data-idx="${e.idx}">Increment</button>
                </td>
            `;
            tbody.appendChild(tr);
        });

        // Edit buttons
        document.querySelectorAll(".edit-btn").forEach(btn => {
            btn.onclick = function() {
                const idx = this.dataset.idx;
                const e = employees[idx];
                const tr = this.closest("tr");

                tr.innerHTML = `
                    <td><input value="${e.id || ""}" id="editId${idx}"></td>
                    <td><input value="${e.name || ""}" id="editName${idx}"></td>
                    <td><input value="${e.department || ""}" id="editDept${idx}"></td>
                    <td><input value="${e.email || ""}" id="editEmail${idx}"></td>
                    <td><input value="${e.mobile || ""}" id="editMobile${idx}"></td>
                    <td><input value="${e.address || ""}" id="editAddress${idx}"></td>
                    <td><input type="date" value="${e.doj || ""}" id="editDoj${idx}"></td>
                    <td><input type="date" value="${e.doj1yr || ""}" id="editDoj1yr${idx}"></td>
                    <td><input type="number" value="${e.basicSalary || ""}" id="editBasicSalary${idx}"></td>
                    <td><input type="number" value="${e.allowances || ""}" id="editAllowances${idx}"></td>
                    <td>
                        <select id="editPFApplicable${idx}">
                            <option value="applicable"${e.pfApplicable==="applicable"?" selected":""}>Applicable</option>
                            <option value="not_applicable"${e.pfApplicable==="not_applicable"?" selected":""}>Not Applicable</option>
                        </select>
                    </td>
                    <td>
                        <select id="editESIApplicable${idx}">
                            <option value="applicable"${e.esiApplicable==="applicable"?" selected":""}>Applicable</option>
                            <option value="not_applicable"${e.esiApplicable==="not_applicable"?" selected":""}>Not Applicable</option>
                        </select>
                    </td>
                    <td>
                        <select id="editTDSApplicable${idx}">
                            <option value="applicable"${e.tdsApplicable==="applicable"?" selected":""}>Applicable</option>
                            <option value="not_applicable"${e.tdsApplicable==="not_applicable"?" selected":""}>Not Applicable</option>
                        </select>
                    </td>
                    <td><input type="number" value="${e.casualLeave || 0}" id="editCasualLeave${idx}"></td>
                    <td><input type="number" value="${e.sickLeave || 0}" id="editSickLeave${idx}"></td>
                    <td><input type="number" value="${e.paidLeave || 0}" id="editPaidLeave${idx}"></td>
                    <td><input type="number" value="${e.COFF || 0}" id="editCoff${idx}" readonly></td>
                    <td><input type="number" value="${e.TotalLeaves || 0}" id="editTotalLeaves${idx}" readonly></td>
                    <td>
                        <button class="save-btn" id="saveEdit${idx}">Save</button>
                        <button class="cancel-btn" id="cancelEdit${idx}">Cancel</button>
                    </td>
                `;

                document.getElementById(`saveEdit${idx}`).onclick = function() {
                    const casual = Number(document.getElementById(`editCasualLeave${idx}`).value);
                    const sick = Number(document.getElementById(`editSickLeave${idx}`).value);
                    const paid = Number(document.getElementById(`editPaidLeave${idx}`).value);
                    const coff = Number(e.COFF || 0);

                    employees[idx] = {
                        id: document.getElementById(`editId${idx}`).value,
                        name: document.getElementById(`editName${idx}`).value,
                        department: document.getElementById(`editDept${idx}`).value,
                        email: document.getElementById(`editEmail${idx}`).value,
                        mobile: document.getElementById(`editMobile${idx}`).value,
                        address: document.getElementById(`editAddress${idx}`).value,
                        doj: document.getElementById(`editDoj${idx}`).value,
                        doj1yr: document.getElementById(`editDoj1yr${idx}`).value,
                        basicSalary: Number(document.getElementById(`editBasicSalary${idx}`).value),
                        allowances: Number(document.getElementById(`editAllowances${idx}`).value),
                        pfApplicable: document.getElementById(`editPFApplicable${idx}`).value,
                        esiApplicable: document.getElementById(`editESIApplicable${idx}`).value,
                        tdsApplicable: document.getElementById(`editTDSApplicable${idx}`).value,
                        casualLeave: casual,
                        sickLeave: sick,
                        paidLeave: paid,
                        COFF: coff,
                        TotalLeaves: casual + sick + paid + coff
                    };
                    showNotif("Employee updated!");
                    renderTable(document.getElementById("empSearch").value.toLowerCase());
                };

                document.getElementById(`cancelEdit${idx}`).onclick = function() {
                    renderTable(document.getElementById("empSearch").value.toLowerCase());
                };
            };
        });

        // Delete buttons
        document.querySelectorAll(".delete-btn").forEach(btn => {
            btn.onclick = function() {
                const idx = this.dataset.idx;
                if (confirm("Delete this employee?")) {
                    employees.splice(idx, 1);
                    showNotif("Employee deleted!");
                    renderTable(document.getElementById("empSearch").value.toLowerCase());
                }
            };
        });

        // Increment buttons - NEW FUNCTIONALITY
        document.querySelectorAll(".increment-btn").forEach(btn => {
            btn.onclick = function() {
                const idx = this.dataset.idx;
                const employee = employees[idx];
                openSalaryHistoryPage(employee);
            };
        });
    }

    // --- Open Salary History Page ---
    function openSalaryHistoryPage(employee) {
        // Create a new window for salary history
        const salaryWindow = window.open('', '_blank');
        
        // Generate HTML for the salary history page
        const salaryHistoryHTML = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Salary History - ${employee.name}</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; }
                    h1 { color: #333; }
                    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                    th { background-color: #f2f2f2; }
                    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
                    .employee-info { background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
                    .employee-info h2 { margin-top: 0; }
                    .close-btn { background-color: #f44336; color: white; padding: 8px 16px; border: none; border-radius: 4px; cursor: pointer; }
                    .close-btn:hover { background-color: #d32f2f; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>Employee Salary History</h1>
                    <button class="close-btn" onclick="window.close()">Close</button>
                </div>
                
                <div class="employee-info">
                    <h2>${employee.name}</h2>
                    <p><strong>Employee ID:</strong> ${employee.id}</p>
                    <p><strong>Department:</strong> ${employee.department}</p>
                    <p><strong>Date of Joining:</strong> ${employee.doj}</p>
                    <p><strong>Current Salary:</strong> ${employee.basicSalary}</p>
                </div>
                
                <table>
                    <thead>
                        <tr>
                            <th>Period</th>
                            <th>Salary Amount</th>
                            <th>Increment Date</th>
                            <th>Increment Amount</th>
                            <th>Notes</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${generateSalaryHistoryRows(employee)}
                    </tbody>
                </table>
                
                <script>
                    // Function to add new salary records
                    function addNewRecord() {
                        const table = document.querySelector('tbody');
                        const newRow = document.createElement('tr');
                        newRow.innerHTML = \`
                            <td><input type="text" placeholder="e.g., Jul-11"></td>
                            <td><input type="number" placeholder="Amount"></td>
                            <td><input type="date"></td>
                            <td><input type="number" placeholder="Increment"></td>
                            <td><input type="text" placeholder="Notes"></td>
                        \`;
                        table.appendChild(newRow);
                    }
                    
                    // Function to save salary history
                    function saveSalaryHistory() {
                        const rows = document.querySelectorAll('tbody tr');
                        const salaryData = [];
                        
                        rows.forEach(row => {
                            const cells = row.querySelectorAll('input');
                            if (cells.length >= 5) {
                                salaryData.push({
                                    period: cells[0].value,
                                    salary: cells[1].value,
                                    incrementDate: cells[2].value,
                                    incrementAmount: cells[3].value,
                                    notes: cells[4].value
                                });
                            }
                        });
                        
                        // In a real application, you would save this data to a database
                        alert('Salary history saved successfully!');
                        console.log('Salary Data:', salaryData);
                    }
                </script>
                
                <div style="margin-top: 20px;">
                    <button onclick="addNewRecord()" style="background-color: #4CAF50; color: white; padding: 8px 16px; border: none; border-radius: 4px; cursor: pointer;">Add New Record</button>
                    <button onclick="saveSalaryHistory()" style="background-color: #2196F3; color: white; padding: 8px 16px; border: none; border-radius: 4px; cursor: pointer; margin-left: 10px;">Save History</button>
                </div>
            </body>
            </html>
        `;
        
        // Write the HTML to the new window
        salaryWindow.document.write(salaryHistoryHTML);
        salaryWindow.document.close();
    }

    // --- Generate Salary History Rows ---
    function generateSalaryHistoryRows(employee) {
        // This would normally come from a database
        // For demonstration, we'll create sample data based on the image
        const sampleData = [
           
        ];
        
        let rowsHTML = '';
        sampleData.forEach(record => {
            rowsHTML += `
                <tr>
                    <td>${record.period}</td>
                    <td>${record.salary}</td>
                    <td>${record.incrementDate}</td>
                    <td>${record.incrementAmount}</td>
                    <td>${record.notes}</td>
                </tr>
            `;
        });
        
        return rowsHTML;
    }

    // --- Add Employee ---
    document.getElementById("addEmpForm").onsubmit = function(e) {
        e.preventDefault();
        const newId = document.getElementById("empId").value.trim();
        if (employees.some(emp => (emp.id || emp.empId || "").toLowerCase() === newId.toLowerCase())) {
            showNotif("Duplicate: Employee ID already exists!", true);
            return;
        }

        const doj = document.getElementById("empDoj").value;
        let doj1yr = "";
        if (doj) {
            const date1yr = new Date(doj);
            date1yr.setFullYear(date1yr.getFullYear() + 1);
            doj1yr = date1yr.toISOString().slice(0, 10);
        }

        employees.push({
            id: newId,
            name: document.getElementById("empName").value,
            department: document.getElementById("empDept").value,
            email: document.getElementById("empEmail").value,
            mobile: document.getElementById("empMobile").value,
            address: document.getElementById("empAddress").value,
            doj: doj,
            doj1yr: doj1yr,
            basicSalary: Number(document.getElementById("empBasicSalary").value),
            allowances: Number(document.getElementById("empAllowances").value),
            pfApplicable: document.getElementById("empPFApplicable").value,
            esiApplicable: document.getElementById("empESIApplicable").value,
            tdsApplicable: document.getElementById("empTDSApplicable").value,
            casualLeave: Number(document.getElementById("empCasualLeave").value),
            sickLeave: Number(document.getElementById("empSickLeave").value),
            paidLeave: Number(document.getElementById("empPaidLeave").value),
            COFF: 0,
            TotalLeaves: 0
        });

        showNotif("Employee added!");
        this.reset();
        renderTable(document.getElementById("empSearch").value.toLowerCase());
    };

    // --- Auto-calc 1 Year Date ---
    document.getElementById("empDoj").addEventListener("change", function() {
        const doj = this.value;
        let doj1yr = "";
        if (doj) {
            const date1yr = new Date(doj);
            date1yr.setFullYear(date1yr.getFullYear() + 1);
            doj1yr = date1yr.toISOString().slice(0, 10);
        }
        document.getElementById("empDoj1yr").value = doj1yr;
    });

    // --- Search ---
    document.getElementById("empSearch").oninput = function() {
        renderTable(this.value.toLowerCase());
    };

    // --- CSV Export ---
    document.getElementById("empExport").onclick = function() {
        let csv = `"Employee ID","Name","Department","Email","Mobile","Address","Date of Joining","1 Year Completed On","Basic Salary","Allowances","PF","ESI","TDS","Casual Leave (Paid)","Sick Leave (Paid)","Paid Leave","C-OFF Days","Total Leaves"\n`;
        employees.forEach(e => {
            csv += `"${e.id || ""}","${e.name || ""}","${e.department || ""}","${e.email || ""}","${e.mobile || ""}","${e.address || ""}","${e.doj || ""}","${e.doj1yr || ""}","${e.basicSalary || ""}","${e.allowances || ""}","${e.pfApplicable === "applicable" ? "Applicable" : (e.pfApplicable === "not_applicable" ? "Not Applicable" : "")}","${e.esiApplicable === "applicable" ? "Applicable" : (e.esiApplicable === "not_applicable" ? "Not Applicable" : "")}","${e.tdsApplicable === "applicable" ? "Applicable" : (e.tdsApplicable === "not_applicable" ? "Not Applicable" : "")}","${e.casualLeave || 0}","${e.sickLeave || 0}","${e.paidLeave || 0}","${e.COFF || 0}","${e.TotalLeaves || 0}"\n`;
        });
        const blob = new Blob([csv], { type: "text/csv" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = "employees.csv";
        link.click();
    };

    // --- Column Sorting ---
    document.querySelectorAll("th[data-col]").forEach(th => {
        th.onclick = function() {
            const col = this.getAttribute("data-col");
            if (sortCol === col) sortAsc = !sortAsc;
            else { sortCol = col; sortAsc = true; }
            renderTable(document.getElementById("empSearch").value.toLowerCase());
        };
    });

    renderTable();
}

// Attendance Module
if(panelKey==="attendance") {
    // Employee ID and Name auto-sync
    const attEmpIdInput = document.getElementById("attEmpId");
    const attEmpNameInput = document.getElementById("attEmp");
    const attMorningInInput = document.getElementById("attMorningIn");
    const attEveningOutInput = document.getElementById("attEveningOut");
    const attExtraHoursInput = document.getElementById("attExtraHours");

    // Auto-calculate extra hours based on Morning In and Evening Out
    function updateExtraHours() {
        // Standard working hours: 09:00 to 18:00 (9 hours)
        const morningIn = attMorningInInput.value;
        const eveningOut = attEveningOutInput.value;
        if (morningIn && eveningOut) {
            const [inH, inM] = morningIn.split(":").map(Number);
            const [outH, outM] = eveningOut.split(":").map(Number);
            const inMinutes = inH * 60 + inM;
            const outMinutes = outH * 60 + outM;
            // Standard: 09:00 (540) to 18:00 (1080)
            const workedMinutes = outMinutes - inMinutes;
            const standardMinutes = 540; // 9 hours
            let extra = (workedMinutes - standardMinutes) / 60;
            if (extra < 0) extra = 0;
            attExtraHoursInput.value = extra.toFixed(2);
        } else {
            attExtraHoursInput.value = "";
        }
    }

    // If user enters extra hours manually, update evening out time accordingly
    function updateEveningOutFromExtra() {
        const morningIn = attMorningInInput.value;
        const extra = parseFloat(attExtraHoursInput.value);
        if (morningIn && !isNaN(extra)) {
            const [inH, inM] = morningIn.split(":").map(Number);
            const inMinutes = inH * 60 + inM;
            const standardMinutes = 540; // 9 hours
            const outMinutes = inMinutes + standardMinutes + Math.round(extra * 60);
            let outH = Math.floor(outMinutes / 60);
            let outM = outMinutes % 60;
            // Clamp to 24:00
            if (outH > 23) outH = 23;
            if (outM > 59) outM = 59;
            attEveningOutInput.value = `${outH.toString().padStart(2, "0")}:${outM.toString().padStart(2, "0")}`;
        }
    }
    if (attMorningInInput && attEveningOutInput && attExtraHoursInput) {
        attMorningInInput.addEventListener("change", updateExtraHours);
        attEveningOutInput.addEventListener("change", updateExtraHours);
        attExtraHoursInput.addEventListener("input", function() {
            // Only update evening out if both morning in and extra hours are present and user is typing extra hours
            if (document.activeElement === attExtraHoursInput) {
                updateEveningOutFromExtra();
            }
        });
    }

    if (attEmpIdInput && attEmpNameInput) {
        attEmpIdInput.addEventListener("change", function() {
            const emp = employees.find(e => e.id === attEmpIdInput.value);
            if (emp) attEmpNameInput.value = emp.name;
        });
        attEmpNameInput.addEventListener("change", function() {
            const emp = employees.find(e => e.name === attEmpNameInput.value);
            if (emp) attEmpIdInput.value = emp.id;
        });
    }
    let sortCol = null, sortAsc = true;
    function renderTable(filter="") {
        let data = attendance.map((a,i)=>({...a, idx:i}));
        if(filter) {
            data = data.filter(a =>
                (a.employeeId || "").toLowerCase().includes(filter) ||
                (a.employee || "").toLowerCase().includes(filter) ||
                (a.date || "").toLowerCase().includes(filter) ||
                (a.status || "").toLowerCase().includes(filter) ||
                ((a.description||"").toLowerCase().includes(filter)) ||
                ((a.morningIn||"").toLowerCase().includes(filter)) ||
                ((a.morningOut||"").toLowerCase().includes(filter)) ||
                ((a.afternoonIn||"").toLowerCase().includes(filter)) ||
                ((a.eveningOut||"").toLowerCase().includes(filter)) ||
                ((a.extraHours||"").toString().includes(filter))
            );
        }
        if(sortCol) {
            data.sort((a,b) => {
                if(a[sortCol] < b[sortCol]) return sortAsc ? -1 : 1;
                if(a[sortCol] > b[sortCol]) return sortAsc ? 1 : -1;
                return 0;
            });
        }
        const tbody = document.getElementById("attTableBody");
        tbody.innerHTML = "";
        data.forEach(a => {
            const empName = a.employee && a.employee.trim() ? a.employee : '<span style="color:#e74c3c;font-weight:bold;">(Not Entered)</span>';
            const empId = a.employeeId && a.employeeId.trim() ? a.employeeId : '';
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td>${empId}</td>
                <td>${empName}</td>
                <td>${a.date || ""}</td>
                <td>${a.status || ""}</td>
                <td>${a.description||""}</td>
                <td>${a.morningIn || ""}</td>
                <td>${a.morningOut || ""}</td>
                <td>${a.afternoonIn || ""}</td>
                <td>${a.eveningOut || ""}</td>
                <td>${typeof a.extraHours !== "undefined" && a.extraHours !== null ? a.extraHours : ""}</td>
                <td class="actions">
                    <button class="edit-btn" data-idx="${a.idx}">Edit</button>
                    <button class="delete-btn" data-idx="${a.idx}">Delete</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
        document.querySelectorAll(".edit-btn").forEach(btn=>{
            btn.onclick = function(){
                let idx = this.dataset.idx;
                let a = attendance[idx];
                let tr = this.closest("tr");
                tr.innerHTML = `
                    <td><input value="${a.employeeId || ""}" id="editEmpId${idx}"></td>
                    <td><input value="${a.employee || ""}" id="editEmp${idx}"></td>
                    <td><input type="date" value="${a.date || ""}" id="editDate${idx}"></td>
                    <td>
                        <select id="editStatus${idx}">
                            <option${a.status==="Present"?" selected":""}>Present</option>
                            <option${a.status==="Absent"?" selected":""}>Absent</option>
                            <option${a.status==="Late"?" selected":""}>Late</option>
                            <option${a.status==="Half Day"?" selected":""}>Half Day</option>
                            <option${a.status==="Off"?" selected":""}>Off</option>
                        </select>
                    </td>
                    <td><input value="${a.description||""}" id="editDesc${idx}"></td>
                    <td><input type="time" value="${a.morningIn||""}" id="editMorningIn${idx}"></td>
                    <td><input type="time" value="${a.morningOut||""}" id="editMorningOut${idx}"></td>
                    <td><input type="time" value="${a.afternoonIn||""}" id="editAfternoonIn${idx}"></td>
                    <td><input type="time" value="${a.eveningOut||""}" id="editEveningOut${idx}"></td>
                    <td><input type="number" min="0" step="0.25" value="${typeof a.extraHours !== "undefined" && a.extraHours !== null ? a.extraHours : ""}" id="editExtraHours${idx}"></td>
                    <td class="actions">
                        <button class="save-btn" id="saveEdit${idx}">Save</button>
                        <button class="cancel-btn" id="cancelEdit${idx}">Cancel</button>
                    </td>
                `;
                // Auto-calc extra hours in edit mode
                const editMorningIn = document.getElementById(`editMorningIn${idx}`);
                const editEveningOut = document.getElementById(`editEveningOut${idx}`);
                const editExtraHours = document.getElementById(`editExtraHours${idx}`);
                function updateEditExtraHours() {
                    const morningIn = editMorningIn.value;
                    const eveningOut = editEveningOut.value;
                    if (morningIn && eveningOut) {
                        const [inH, inM] = morningIn.split(":").map(Number);
                        const [outH, outM] = eveningOut.split(":").map(Number);
                        const inMinutes = inH * 60 + inM;
                        const outMinutes = outH * 60 + outM;
                        const workedMinutes = outMinutes - inMinutes;
                        const standardMinutes = 540;
                        let extra = (workedMinutes - standardMinutes) / 60;
                        if (extra < 0) extra = 0;
                        editExtraHours.value = extra.toFixed(2);
                    } else {
                        editExtraHours.value = "";
                    }
                }
                function updateEditEveningOutFromExtra() {
                    const morningIn = editMorningIn.value;
                    const extra = parseFloat(editExtraHours.value);
                    if (morningIn && !isNaN(extra)) {
                        const [inH, inM] = morningIn.split(":").map(Number);
                        const inMinutes = inH * 60 + inM;
                        const standardMinutes = 540; // 9 hours
                        const outMinutes = inMinutes + standardMinutes + Math.round(extra * 60);
                        let outH = Math.floor(outMinutes / 60);
                        let outM = outMinutes % 60;
                        if (outH > 23) outH = 23;
                        if (outM > 59) outM = 59;
                        editEveningOut.value = `${outH.toString().padStart(2, "0")}:${outM.toString().padStart(2, "0")}`;
                    }
                }

                if (editMorningIn && editEveningOut && editExtraHours) {
                    editMorningIn.addEventListener("change", updateEditExtraHours);
                    editEveningOut.addEventListener("change", updateEditExtraHours);
                    editExtraHours.addEventListener("input", function() {
                        if (document.activeElement === editExtraHours) {
                            updateEditEveningOutFromExtra();
                        }
                    });
                }
                // Employee ID and Name auto-sync in edit mode
                document.getElementById(`saveEdit${idx}`).onclick = function(){
                    // Prevent duplicate for same date and employee name
                    const newEmpId = document.getElementById(`editEmpId${idx}`).value.trim();
                    const newEmpName = document.getElementById(`editEmp${idx}`).value.trim();
                    const newDate = document.getElementById(`editDate${idx}`).value.trim();
                    // Check for duplicate (ignore current idx)
                    const duplicate = attendance.some((rec, i) =>
                        i !== Number(idx) &&
                        rec.employee &&
                        rec.employee.trim().toLowerCase() === newEmpName.toLowerCase() &&
                        rec.date === newDate
                    );
                    if (duplicate) {
                        showNotif("Duplicate: Same employee name and date already exists!", true);
                        return;
                    }
                    attendance[idx] = {
                        employeeId: newEmpId,
                        employee: newEmpName,
                        date: newDate,
                        status: document.getElementById(`editStatus${idx}`).value,
                        description: document.getElementById(`editDesc${idx}`).value,
                        morningIn: document.getElementById(`editMorningIn${idx}`).value,
                        morningOut: document.getElementById(`editMorningOut${idx}`).value,
                        afternoonIn: document.getElementById(`editAfternoonIn${idx}`).value,
                        eveningOut: document.getElementById(`editEveningOut${idx}`).value,
                        extraHours: document.getElementById(`editExtraHours${idx}`).value === "" ? undefined : parseFloat(document.getElementById(`editExtraHours${idx}`).value)
                    };
                    // Update sessionStorage with the modified attendance data
                    sessionStorage.setItem('attendanceData', JSON.stringify(attendance));
                    showNotif("Attendance updated!");
                    renderTable(document.getElementById("attSearch").value.toLowerCase());
                    renderLateSummary(); // Update summary after edit
                };
                document.getElementById(`cancelEdit${idx}`).onclick = function(){
                    renderTable(document.getElementById("attSearch").value.toLowerCase());
                };
            };
        });
        document.querySelectorAll(".delete-btn").forEach(btn=>{
            btn.onclick = function(){
                let idx = this.dataset.idx;
                if(confirm("Delete this attendance record?")) {
                    attendance.splice(idx,1);
                    // Update sessionStorage with the modified attendance data
                    sessionStorage.setItem('attendanceData', JSON.stringify(attendance));
                    showNotif("Attendance deleted!");
                    renderTable(document.getElementById("attSearch").value.toLowerCase());
                    renderLateSummary(); // Update summary after delete
                }
            };
        });
    }

    // Late Arrivals Summary rendering
    function renderLateSummary() {
        // Count number of "Late" records for each employeeId+employee
        const lateCounts = {};
        attendance.forEach(a => {
            // Only count if both employeeId and employee are entered
            if (a.status === "Late" && a.employeeId && a.employee) {
                const key = (a.employeeId || "") + "|" + (a.employee || "");
                lateCounts[key] = (lateCounts[key] || 0) + 1;
            }
        });
        const tbody = document.querySelector('h3 + table tbody');
        if (!tbody) return;
        if (Object.keys(lateCounts).length === 0) {
            tbody.innerHTML = `<tr><td colspan="3" style="text-align:center;color:#888;">No late records</td></tr>`;
        } else {
            tbody.innerHTML = Object.entries(lateCounts).map(([key, count]) => {
                const [empId, empName] = key.split("|");
                return `<tr><td>${empId}</td><td>${empName}</td><td>${count}</td></tr>`;
            }).join("");
        }
    }

    // Function to get short form of status
    function getStatusShortForm(status) {
        switch(status) {
            case 'Present':
            case 'P':
                return 'P';
            case 'Absent':
            case 'A':
                return 'A';
            case 'Late':
            case 'L':
                return 'L';
            case 'Half Day':
            case 'HD':
                return 'HD';
            case 'Off':
            case 'OFF':
                return 'OFF';
            default:
                return 'NF';
        }
    }

    // Function to open the attendance report in a new page
    function openAttendanceReport() {
        // Store attendance data in sessionStorage for the new page
        sessionStorage.setItem('attendanceData', JSON.stringify(attendance));
        
        // Open the report page in a new window
        const reportWindow = window.open('', '_blank');
        
        // Write the HTML content for the report page
        reportWindow.document.write(`
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Attendance Report</title>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        margin: 0;
                        padding: 20px;
                        background-color: #f5f5f5;
                    }
                    .container {
                        max-width: 1200px;
                        margin: 0 auto;
                        background-color: white;
                        padding: 20px;
                        border-radius: 8px;
                        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                    }
                    h1 {
                        color: #333;
                        text-align: center;
                        margin-bottom: 30px;
                    }
                    .filters {
                        display: flex;
                        flex-wrap: wrap;
                        gap: 15px;
                        margin-bottom: 20px;
                        padding: 15px;
                        background-color: #f9f9f9;
                        border-radius: 5px;
                    }
                    .filter-group {
                        display: flex;
                        flex-direction: column;
                    }
                    .filter-group label {
                        margin-bottom: 5px;
                        font-weight: bold;
                    }
                    .filter-group select, .filter-group input {
                        padding: 8px;
                        border: 1px solid #ddd;
                        border-radius: 4px;
                    }
                    .btn {
                        padding: 10px 15px;
                        background-color: #3498db;
                        color: white;
                        border: none;
                        border-radius: 4px;
                        cursor: pointer;
                        font-weight: bold;
                    }
                    .btn:hover {
                        background-color: #2980b9;
                    }
                    .table-container {
                        overflow-x: auto;
                        margin-top: 20px;
                    }
                    table {
                        width: 100%;
                        border-collapse: collapse;
                        min-width: 800px;
                    }
                    th, td {
                        border: 1px solid #ddd;
                        padding: 8px;
                        text-align: center;
                        white-space: nowrap;
                    }
                    th {
                        background-color: #f2f2f2;
                        font-weight: bold;
                        position: sticky;
                        top: 0;
                    }
                    .status-present { background-color: #d4edda; }
                    .status-absent { background-color: #f8d7da; }
                    .status-late { background-color: #fff3cd; }
                    .status-halfday { background-color: #d1ecf1; }
                    .status-off { background-color: #e2e3e5; }
                    .status-nf { background-color: #f8f9fa; }
                    .legend {
                        margin-top: 20px;
                        padding: 10px;
                        background-color: #f9f9f9;
                        border-radius: 5px;
                    }
                    .legend h3 {
                        margin-top: 0;
                    }
                    .legend-item {
                        display: inline-block;
                        margin-right: 15px;
                    }
                    .legend-color {
                        display: inline-block;
                        width: 15px;
                        height: 15px;
                        margin-right: 5px;
                        border: 1px solid #ddd;
                    }
                    .entry-count {
                        text-align: right;
                        margin-top: 10px;
                        color: #666;
                    }
                    .pay-cycle {
                        border-top: 1px solid #eee;
                        padding-top: 15px;
                        margin-top: 15px;
                    }
                    .summary-cols {
                        background-color: #e8f4fc;
                        font-weight: bold;
                    }
                    .search-container {
                        margin-bottom: 15px;
                    }
                    .search-container input {
                        width: 100%;
                        padding: 10px;
                        border: 1px solid #ddd;
                        border-radius: 4px;
                        font-size: 16px;
                    }
                    .edit-btn, .save-btn, .cancel-btn {
                        padding: 5px 10px;
                        margin: 0 2px;
                        border: none;
                        border-radius: 3px;
                        cursor: pointer;
                    }
                    .edit-btn {
                        background-color: #f39c12;
                        color: white;
                    }
                    .save-btn {
                        background-color: #27ae60;
                        color: white;
                    }
                    .cancel-btn {
                        background-color: #e74c3c;
                        color: white;
                    }
                    .edit-input {
                        width: 100%;
                        padding: 5px;
                        border: 1px solid #ddd;
                        border-radius: 3px;
                    }
                    @media print {
                        body {
                            padding: 0;
                            background-color: white;
                        }
                        .container {
                            box-shadow: none;
                            padding: 10px;
                        }
                        .filters, .btn, .legend, .search-container {
                            display: none;
                        }
                        .table-container {
                            margin-top: 0;
                        }
                        .edit-btn, .save-btn, .cancel-btn {
                            display: none;
                        }
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <h1>Attendance Report</h1>
                    
                    <div class="filters">
                        <div class="filter-group">
                            <label for="dept">Department</label>
                            <select id="dept">
                                <option value="">All Departments</option>
                                <option value="IT">IT</option>
                                <option value="HR">HR</option>
                                <option value="Finance">Finance</option>
                                <option value="Operations">Operations</option>
                            </select>
                        </div>
                        
                        <div class="filter-group">
                            <label for="shift">Shift</label>
                            <select id="shift">
                                <option value="">All Shifts</option>
                                <option value="Morning">Morning</option>
                                <option value="Afternoon">Afternoon</option>
                                <option value="Night">Night</option>
                            </select>
                        </div>
                        
                        <div class="filter-group">
                            <label for="year">Year</label>
                            <select id="year">
                                ${Array.from({length: 10}, (_, i) => {
                                    const year = new Date().getFullYear() - i;
                                    return `<option value="${year}" ${year === new Date().getFullYear() ? 'selected' : ''}>${year}</option>`;
                                }).join('')}
                            </select>
                        </div>
                        
                        <div class="filter-group">
                            <label for="month">Month</label>
                            <select id="month">
                                ${Array.from({length: 12}, (_, i) => {
                                    const month = i + 1;
                                    const monthName = new Date(0, month).toLocaleString('default', { month: 'long' });
                                    return `<option value="${month}" ${month === new Date().getMonth() + 1 ? 'selected' : ''}>${monthName}</option>`;
                                }).join('')}
                            </select>
                        </div>
                        
                        <div class="filter-group">
                            <label>&nbsp;</label>
                            <button id="generateBtn" class="btn">Show Report</button>
                        </div>
                    </div>
                    
                    <div class="filters pay-cycle">
                        <div class="filter-group">
                            <label for="fromDate">From Date</label>
                            <input type="date" id="fromDate">
                        </div>
                        
                        <div class="filter-group">
                            <label for="toDate">To Date</label>
                            <input type="date" id="toDate">
                        </div>
                        
                        <div class="filter-group">
                            <label>&nbsp;</label>
                            <button id="generatePayCycleBtn" class="btn">Generate Pay Cycle Report</button>
                        </div>
                    </div>
                    
                    <div class="search-container">
                        <input type="text" id="reportSearch" placeholder="Search by Employee ID or Name...">
                    </div>
                    
                    <div id="reportContainer">
                        <!-- Report will be generated here -->
                    </div>
                    
                    <div class="legend">
                        <h3>Status Legend</h3>
                        <div class="legend-item">
                            <span class="legend-color status-present"></span>
                            <span>Present (P)</span>
                        </div>
                        <div class="legend-item">
                            <span class="legend-color status-absent"></span>
                            <span>Absent (A)</span>
                        </div>
                        <div class="legend-item">
                            <span class="legend-color status-late"></span>
                            <span>Late (L)</span>
                        </div>
                        <div class="legend-item">
                            <span class="legend-color status-halfday"></span>
                            <span>Half Day (HD)</span>
                        </div>
                        <div class="legend-item">
                            <span class="legend-color status-off"></span>
                            <span>Off (OFF)</span>
                        </div>
                        <div class="legend-item">
                            <span class="legend-color status-nf"></span>
                            <span>Not Found (NF)</span>
                        </div>
                    </div>
                </div>
                
                <script>
                    // Get attendance data from sessionStorage
                    let attendance = JSON.parse(sessionStorage.getItem('attendanceData')) || [];
                    
                    // Set default dates for pay cycle (current month)
                    const now = new Date();
                    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
                    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
                    
                    // Format dates as YYYY-MM-DD
                    function formatDate(date) {
                        const year = date.getFullYear();
                        const month = String(date.getMonth() + 1).padStart(2, '0');
                        const day = String(date.getDate()).padStart(2, '0');
                        return \`\${year}-\${month}-\${day}\`;
                    }
                    
                    // Function to get short form of status
                    function getStatusShortForm(status) {
                        switch(status) {
                            case 'Present':
                            case 'P':
                                return 'P';
                            case 'Absent':
                            case 'A':
                                return 'A';
                            case 'Late':
                            case 'L':
                                return 'L';
                            case 'Half Day':
                            case 'HD':
                                return 'HD';
                            case 'Off':
                            case 'OFF':
                                return 'OFF';
                            default:
                                return 'NF';
                        }
                    }
                    
                    // Function to update attendance data in sessionStorage and notify main window
                    function updateAttendanceData() {
                        sessionStorage.setItem('attendanceData', JSON.stringify(attendance));
                        // Create a custom event to notify the main window
                        const event = new StorageEvent('storage', {
                            key: 'attendanceData',
                            newValue: JSON.stringify(attendance),
                            url: window.location.href
                        });
                        window.dispatchEvent(event);
                    }
                    
                    // Set default values for date inputs
                    document.getElementById('fromDate').value = formatDate(firstDay);
                    document.getElementById('toDate').value = formatDate(lastDay);
                    
                    // Function to generate the monthly report
                    function generateReport() {
                        const dept = document.getElementById('dept').value;
                        const shift = document.getElementById('shift').value;
                        const year = document.getElementById('year').value;
                        const month = document.getElementById('month').value;
                        
                        // Get the number of days in the selected month
                        const daysInMonth = new Date(year, month, 0).getDate();
                        
                        // Filter attendance records based on selected filters
                        let filteredAttendance = attendance.filter(record => {
                            const recordDate = new Date(record.date);
                            const recordYear = recordDate.getFullYear().toString();
                            const recordMonth = (recordDate.getMonth() + 1).toString();
                            
                            // Check year and month match
                            if (recordYear !== year || recordMonth !== month) return false;
                            
                            // Check department and shift if specified
                            if (dept && record.department !== dept) return false;
                            if (shift && record.shift !== shift) return false;
                            
                            return true;
                        });
                        
                        // Group attendance by employee and calculate lates and leaves
                        const employeeAttendance = {};
                        filteredAttendance.forEach(record => {
                            if (!employeeAttendance[record.employeeId]) {
                                employeeAttendance[record.employeeId] = {
                                    id: record.employeeId,
                                    name: record.employee,
                                    days: {},
                                    lates: 0,
                                    leaves: 0,
                                    records: []
                                };
                            }
                            
                            const day = new Date(record.date).getDate();
                            employeeAttendance[record.employeeId].days[day] = record.status;
                            employeeAttendance[record.employeeId].records.push(record);
                            
                            // Count lates
                            if (record.status === 'Late' || record.status === 'L') {
                                employeeAttendance[record.employeeId].lates++;
                            }
                            
                            // Count leaves (Absent, Off, Half Day)
                            if (record.status === 'Absent' || record.status === 'A' || 
                                record.status === 'Off' || record.status === 'OFF' || 
                                record.status === 'Half Day' || record.status === 'HD') {
                                employeeAttendance[record.employeeId].leaves++;
                            }
                        });
                        
                        // Create the report table
                        let tableHTML = \`
                            <div class="table-container">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Employee ID</th>
                                            <th>Employee Name</th>
                                            <th class="summary-cols">No of Lates</th>
                                            <th class="summary-cols">Total Leaves</th>
                                            <th>Actions</th>
                        \`;
                        
                        // Add day headers
                        for (let day = 1; day <= daysInMonth; day++) {
                            tableHTML += \`<th>\${day}</th>\`;
                        }
                        
                        tableHTML += \`
                                        </tr>
                                    </thead>
                                    <tbody>
                        \`;
                        
                        // Add employee rows
                        Object.values(employeeAttendance).forEach(employee => {
                            tableHTML += \`
                                <tr data-empid="\${employee.id}">
                                    <td>\${employee.id}</td>
                                    <td>\${employee.name}</td>
                                    <td class="summary-cols">\${employee.lates}</td>
                                    <td class="summary-cols">\${employee.leaves}</td>
                                    <td><button class="edit-btn" data-empid="\${employee.id}">Edit</button></td>
                            \`;
                            
                            // Add day status cells
                            for (let day = 1; day <= daysInMonth; day++) {
                                const status = employee.days[day] || 'NF';
                                const shortStatus = getStatusShortForm(status);
                                let statusClass = '';
                                
                                // Set class based on status
                                switch(status) {
                                    case 'P':
                                    case 'Present':
                                        statusClass = 'status-present';
                                        break;
                                    case 'A':
                                    case 'Absent':
                                        statusClass = 'status-absent';
                                        break;
                                    case 'L':
                                    case 'Late':
                                        statusClass = 'status-late';
                                        break;
                                    case 'HD':
                                    case 'Half Day':
                                        statusClass = 'status-halfday';
                                        break;
                                    case 'OFF':
                                    case 'Off':
                                        statusClass = 'status-off';
                                        break;
                                    case 'NF':
                                        statusClass = 'status-nf';
                                        break;
                                }
                                
                                tableHTML += \`<td class="\${statusClass}" data-day="\${day}">\${shortStatus}</td>\`;
                            }
                            
                            tableHTML += \`
                                </tr>
                            \`;
                        });
                        
                        tableHTML += \`
                                    </tbody>
                                </table>
                            </div>
                            <div class="entry-count">Showing 1 to \${Object.keys(employeeAttendance).length} of \${Object.keys(employeeAttendance).length} entries</div>
                        \`;
                        
                        // Update the report container
                        document.getElementById('reportContainer').innerHTML = tableHTML;
                        
                        // Add event listeners to edit buttons
                        document.querySelectorAll('.edit-btn').forEach(btn => {
                            btn.addEventListener('click', function() {
                                const empId = this.getAttribute('data-empid');
                                editEmployeeAttendance(empId, year, month);
                            });
                        });
                    }
                    
                    // Function to generate the pay cycle report
                    function generatePayCycleReport() {
                        const dept = document.getElementById('dept').value;
                        const shift = document.getElementById('shift').value;
                        const fromDate = document.getElementById('fromDate').value;
                        const toDate = document.getElementById('toDate').value;
                        
                        if (!fromDate || !toDate) {
                            alert('Please select both From Date and To Date');
                            return;
                        }
                        
                        // Create date range array
                        const dateRange = [];
                        const start = new Date(fromDate);
                        const end = new Date(toDate);
                        
                        // Validate date range
                        if (start > end) {
                            alert('From Date must be before To Date');
                            return;
                        }
                        
                        // Generate all dates in the range
                        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
                            dateRange.push(new Date(d));
                        }
                        
                        // Filter attendance records based on selected filters
                        let filteredAttendance = attendance.filter(record => {
                            const recordDate = new Date(record.date);
                            
                            // Check if record is within date range
                            if (recordDate < start || recordDate > end) return false;
                            
                            // Check department and shift if specified
                            if (dept && record.department !== dept) return false;
                            if (shift && record.shift !== shift) return false;
                            
                            return true;
                        });
                        
                        // Group attendance by employee and calculate lates and leaves
                        const employeeAttendance = {};
                        filteredAttendance.forEach(record => {
                            if (!employeeAttendance[record.employeeId]) {
                                employeeAttendance[record.employeeId] = {
                                    id: record.employeeId,
                                    name: record.employee,
                                    days: {},
                                    lates: 0,
                                    leaves: 0,
                                    records: []
                                };
                            }
                            
                            const dateKey = record.date;
                            employeeAttendance[record.employeeId].days[dateKey] = record.status;
                            employeeAttendance[record.employeeId].records.push(record);
                            
                            // Count lates
                            if (record.status === 'Late' || record.status === 'L') {
                                employeeAttendance[record.employeeId].lates++;
                            }
                            
                            // Count leaves (Absent, Off, Half Day)
                            if (record.status === 'Absent' || record.status === 'A' || 
                                record.status === 'Off' || record.status === 'OFF' || 
                                record.status === 'Half Day' || record.status === 'HD') {
                                employeeAttendance[record.employeeId].leaves++;
                            }
                        });
                        
                        // Create the report table
                        let tableHTML = \`
                            <h2>Pay Cycle Report: \${formatDate(start)} to \${formatDate(end)}</h2>
                            <div class="table-container">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Employee ID</th>
                                            <th>Employee Name</th>
                                            <th class="summary-cols">No of Lates</th>
                                            <th class="summary-cols">Total Leaves</th>
                                            <th>Actions</th>
                        \`;
                        
                        // Add date headers
                        dateRange.forEach(date => {
                            const day = date.getDate();
                            tableHTML += \`<th>\${day}</th>\`;
                        });
                        
                        tableHTML += \`
                                        </tr>
                                    </thead>
                                    <tbody>
                        \`;
                        
                        // Add employee rows
                        Object.values(employeeAttendance).forEach(employee => {
                            tableHTML += \`
                                <tr data-empid="\${employee.id}">
                                    <td>\${employee.id}</td>
                                    <td>\${employee.name}</td>
                                    <td class="summary-cols">\${employee.lates}</td>
                                    <td class="summary-cols">\${employee.leaves}</td>
                                    <td><button class="edit-btn" data-empid="\${employee.id}">Edit</button></td>
                            \`;
                            
                            // Add day status cells
                            dateRange.forEach(date => {
                                const dateKey = formatDate(date);
                                const status = employee.days[dateKey] || 'NF';
                                const shortStatus = getStatusShortForm(status);
                                let statusClass = '';
                                
                                // Set class based on status
                                switch(status) {
                                    case 'P':
                                    case 'Present':
                                        statusClass = 'status-present';
                                        break;
                                    case 'A':
                                    case 'Absent':
                                        statusClass = 'status-absent';
                                        break;
                                    case 'L':
                                    case 'Late':
                                        statusClass = 'status-late';
                                        break;
                                    case 'HD':
                                    case 'Half Day':
                                        statusClass = 'status-halfday';
                                        break;
                                    case 'OFF':
                                    case 'Off':
                                        statusClass = 'status-off';
                                        break;
                                    case 'NF':
                                        statusClass = 'status-nf';
                                        break;
                                }
                                
                                tableHTML += \`<td class="\${statusClass}" data-date="\${dateKey}">\${shortStatus}</td>\`;
                            });
                            
                            tableHTML += \`
                                </tr>
                            \`;
                        });
                        
                        tableHTML += \`
                                    </tbody>
                                </table>
                            </div>
                            <div class="entry-count">Showing 1 to \${Object.keys(employeeAttendance).length} of \${Object.keys(employeeAttendance).length} entries</div>
                        \`;
                        
                        // Update the report container
                        document.getElementById('reportContainer').innerHTML = tableHTML;
                        
                        // Add event listeners to edit buttons
                        document.querySelectorAll('.edit-btn').forEach(btn => {
                            btn.addEventListener('click', function() {
                                const empId = this.getAttribute('data-empid');
                                editEmployeeAttendancePayCycle(empId, fromDate, toDate);
                            });
                        });
                    }
                    
                    // Function to edit employee attendance for monthly report
                    function editEmployeeAttendance(empId, year, month) {
                        const employeeRow = document.querySelector(\`tr[data-empid="\${empId}"]\`);
                        if (!employeeRow) return;
                        
                        // Get all attendance records for this employee in the selected month
                        const employeeRecords = attendance.filter(record => {
                            const recordDate = new Date(record.date);
                            const recordYear = recordDate.getFullYear().toString();
                            const recordMonth = (recordDate.getMonth() + 1).toString();
                            return record.employeeId === empId && recordYear === year && recordMonth === month;
                        });
                        
                        // Create a map of date to status for quick lookup
                        const dateStatusMap = {};
                        employeeRecords.forEach(record => {
                            dateStatusMap[record.date] = record.status;
                        });
                        
                        // Get the number of days in the selected month
                        const daysInMonth = new Date(year, month, 0).getDate();
                        
                        // Replace the row with edit inputs
                        let editHTML = \`
                            <td>\${empId}</td>
                            <td>\${employeeRow.cells[1].textContent}</td>
                            <td class="summary-cols">\${employeeRow.cells[2].textContent}</td>
                            <td class="summary-cols">\${employeeRow.cells[3].textContent}</td>
                            <td>
                                <button class="save-btn" data-empid="\${empId}">Save</button>
                                <button class="cancel-btn" data-empid="\${empId}">Cancel</button>
                            </td>
                        \`;
                        
                        // Add edit inputs for each day
                        for (let day = 1; day <= daysInMonth; day++) {
                            const dateStr = \`\${year}-\${String(month).padStart(2, '0')}-\${String(day).padStart(2, '0')}\`;
                            const currentStatus = dateStatusMap[dateStr] || 'NF';
                            
                            editHTML += \`
                                <td>
                                    <select class="edit-input" data-date="\${dateStr}">
                                        <option value="Present" \${currentStatus === 'Present' ? 'selected' : ''}>P</option>
                                        <option value="Absent" \${currentStatus === 'Absent' ? 'selected' : ''}>A</option>
                                        <option value="Late" \${currentStatus === 'Late' ? 'selected' : ''}>L</option>
                                        <option value="Half Day" \${currentStatus === 'Half Day' ? 'selected' : ''}>HD</option>
                                        <option value="Off" \${currentStatus === 'Off' ? 'selected' : ''}>OFF</option>
                                        <option value="NF" \${currentStatus === 'NF' ? 'selected' : ''}>NF</option>
                                    </select>
                                </td>
                            \`;
                        }
                        
                        employeeRow.innerHTML = editHTML;
                        
                        // Add event listeners to save and cancel buttons
                        employeeRow.querySelector('.save-btn').addEventListener('click', function() {
                            saveEmployeeAttendance(empId, year, month);
                        });
                        
                        employeeRow.querySelector('.cancel-btn').addEventListener('click', function() {
                            generateReport();
                        });
                    }
                    
                    // Function to edit employee attendance for pay cycle report
                    function editEmployeeAttendancePayCycle(empId, fromDate, toDate) {
                        const employeeRow = document.querySelector(\`tr[data-empid="\${empId}"]\`);
                        if (!employeeRow) return;
                        
                        // Get all attendance records for this employee in the selected date range
                        const start = new Date(fromDate);
                        const end = new Date(toDate);
                        
                        const employeeRecords = attendance.filter(record => {
                            const recordDate = new Date(record.date);
                            return record.employeeId === empId && recordDate >= start && recordDate <= end;
                        });
                        
                        // Create a map of date to status for quick lookup
                        const dateStatusMap = {};
                        employeeRecords.forEach(record => {
                            dateStatusMap[record.date] = record.status;
                        });
                        
                        // Generate all dates in the range
                        const dateRange = [];
                        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
                            dateRange.push(new Date(d));
                        }
                        
                        // Replace the row with edit inputs
                        let editHTML = \`
                            <td>\${empId}</td>
                            <td>\${employeeRow.cells[1].textContent}</td>
                            <td class="summary-cols">\${employeeRow.cells[2].textContent}</td>
                            <td class="summary-cols">\${employeeRow.cells[3].textContent}</td>
                            <td>
                                <button class="save-btn" data-empid="\${empId}">Save</button>
                                <button class="cancel-btn" data-empid="\${empId}">Cancel</button>
                            </td>
                        \`;
                        
                        // Add edit inputs for each date
                        dateRange.forEach(date => {
                            const dateStr = formatDate(date);
                            const currentStatus = dateStatusMap[dateStr] || 'NF';
                            
                            editHTML += \`
                                <td>
                                    <select class="edit-input" data-date="\${dateStr}">
                                        <option value="Present" \${currentStatus === 'Present' ? 'selected' : ''}>P</option>
                                        <option value="Absent" \${currentStatus === 'Absent' ? 'selected' : ''}>A</option>
                                        <option value="Late" \${currentStatus === 'Late' ? 'selected' : ''}>L</option>
                                        <option value="Half Day" \${currentStatus === 'Half Day' ? 'selected' : ''}>HD</option>
                                        <option value="Off" \${currentStatus === 'Off' ? 'selected' : ''}>OFF</option>
                                        <option value="NF" \${currentStatus === 'NF' ? 'selected' : ''}>NF</option>
                                    </select>
                                </td>
                            \`;
                        });
                        
                        employeeRow.innerHTML = editHTML;
                        
                        // Add event listeners to save and cancel buttons
                        employeeRow.querySelector('.save-btn').addEventListener('click', function() {
                            saveEmployeeAttendancePayCycle(empId, fromDate, toDate);
                        });
                        
                        employeeRow.querySelector('.cancel-btn').addEventListener('click', function() {
                            generatePayCycleReport();
                        });
                    }
                    
                    // Function to save employee attendance for monthly report
                    function saveEmployeeAttendance(empId, year, month) {
                        const employeeRow = document.querySelector(\`tr[data-empid="\${empId}"]\`);
                        if (!employeeRow) return;
                        
                        // Get all edit inputs
                        const editInputs = employeeRow.querySelectorAll('.edit-input');
                        
                        // Process each edit input
                        editInputs.forEach(input => {
                            const date = input.getAttribute('data-date');
                            const newStatus = input.value;
                            
                            // Find existing record for this date
                            const existingRecordIndex = attendance.findIndex(record => 
                                record.employeeId === empId && record.date === date
                            );
                            
                            if (existingRecordIndex !== -1) {
                                // Update existing record
                                attendance[existingRecordIndex].status = newStatus;
                            } else if (newStatus !== 'NF') {
                                // Create new record if status is not NF
                                attendance.push({
                                    employeeId: empId,
                                    employee: employeeRow.cells[1].textContent,
                                    date: date,
                                    status: newStatus,
                                    description: "",
                                    morningIn: "",
                                    morningOut: "",
                                    afternoonIn: "",
                                    eveningOut: "",
                                    extraHours: undefined
                                });
                            }
                        });
                        
                        // Update attendance data in sessionStorage and notify main window
                        updateAttendanceData();
                        
                        // Regenerate the report
                        generateReport();
                        
                        // Show notification
                        showNotification('Attendance updated successfully!');
                    }
                    
                    // Function to save employee attendance for pay cycle report
                    function saveEmployeeAttendancePayCycle(empId, fromDate, toDate) {
                        const employeeRow = document.querySelector(\`tr[data-empid="\${empId}"]\`);
                        if (!employeeRow) return;
                        
                        // Get all edit inputs
                        const editInputs = employeeRow.querySelectorAll('.edit-input');
                        
                        // Process each edit input
                        editInputs.forEach(input => {
                            const date = input.getAttribute('data-date');
                            const newStatus = input.value;
                            
                            // Find existing record for this date
                            const existingRecordIndex = attendance.findIndex(record => 
                                record.employeeId === empId && record.date === date
                            );
                            
                            if (existingRecordIndex !== -1) {
                                // Update existing record
                                attendance[existingRecordIndex].status = newStatus;
                            } else if (newStatus !== 'NF') {
                                // Create new record if status is not NF
                                attendance.push({
                                    employeeId: empId,
                                    employee: employeeRow.cells[1].textContent,
                                    date: date,
                                    status: newStatus,
                                    description: "",
                                    morningIn: "",
                                    morningOut: "",
                                    afternoonIn: "",
                                    eveningOut: "",
                                    extraHours: undefined
                                });
                            }
                        });
                        
                        // Update attendance data in sessionStorage and notify main window
                        updateAttendanceData();
                        
                        // Regenerate the report
                        generatePayCycleReport();
                        
                        // Show notification
                        showNotification('Attendance updated successfully!');
                    }
                    
                    // Function to show notification
                    function showNotification(message, isError = false) {
                        const notification = document.createElement('div');
                        notification.style.position = 'fixed';
                        notification.style.top = '20px';
                        notification.style.right = '20px';
                        notification.style.padding = '15px';
                        notification.style.backgroundColor = isError ? '#e74c3c' : '#2ecc71';
                        notification.style.color = 'white';
                        notification.style.borderRadius = '5px';
                        notification.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
                        notification.style.zIndex = '1000';
                        notification.textContent = message;
                        
                        document.body.appendChild(notification);
                        
                        // Remove notification after 3 seconds
                        setTimeout(() => {
                            document.body.removeChild(notification);
                        }, 3000);
                    }
                    
                    // Add search functionality
                    document.getElementById('reportSearch').addEventListener('input', function() {
                        const searchTerm = this.value.toLowerCase();
                        const rows = document.querySelectorAll('#reportContainer table tbody tr');
                        
                        rows.forEach(row => {
                            const empId = row.cells[0].textContent.toLowerCase();
                            const empName = row.cells[1].textContent.toLowerCase();
                            
                            if (empId.includes(searchTerm) || empName.includes(searchTerm)) {
                                row.style.display = '';
                            } else {
                                row.style.display = 'none';
                            }
                        });
                        
                        // Update entry count
                        const visibleRows = Array.from(rows).filter(row => row.style.display !== 'none');
                        const entryCount = document.querySelector('.entry-count');
                        if (entryCount) {
                            entryCount.textContent = \`Showing 1 to \${visibleRows.length} of \${visibleRows.length} entries\`;
                        }
                    });
                    
                    // Add event listeners
                    document.getElementById('generateBtn').addEventListener('click', generateReport);
                    document.getElementById('generatePayCycleBtn').addEventListener('click', generatePayCycleReport);
                    
                    // Generate initial report
                    generateReport();
                </script>
            </body>
            </html>
        `);
        
        // Close the document to finish loading
        reportWindow.document.close();
    }

    // Listen for storage events to update attendance data when report is edited
    window.addEventListener('storage', function(event) {
        if (event.key === 'attendanceData' && event.newValue) {
            // Update the attendance array from sessionStorage
            const updatedAttendance = JSON.parse(event.newValue) || [];
            
            // Update the global attendance array
            attendance.length = 0; // Clear the array
            updatedAttendance.forEach(record => {
                attendance.push(record);
            });
            
            // Re-render the table and summary
            renderTable(document.getElementById("attSearch").value.toLowerCase());
            renderLateSummary();
            
            // Show notification
            showNotif("Attendance data updated from report!");
        }
    });

    document.getElementById("addAttForm").onsubmit = function(e){
        e.preventDefault();
        // Auto-detect "Late" if morningIn > 09:05
        let status = document.getElementById("attStatus").value;
        let morningIn = document.getElementById("attMorningIn").value;
        if (morningIn && status === "Present") {
            const [h, m] = morningIn.split(":").map(Number);
            if (h > 9 || (h === 9 && m > 5)) {
                status = "Late";
            }
        }

        // Auto-calculate extra hours if not entered
        let extraHours = document.getElementById("attExtraHours").value;
        if (!extraHours) {
            const morningInVal = document.getElementById("attMorningIn").value;
            const eveningOutVal = document.getElementById("attEveningOut").value;
            if (morningInVal && eveningOutVal) {
                const [inH, inM] = morningInVal.split(":").map(Number);
                const [outH, outM] = eveningOutVal.split(":").map(Number);
                const inMinutes = inH * 60 + inM;
                const outMinutes = outH * 60 + outM;
                const workedMinutes = outMinutes - inMinutes;
                const standardMinutes = 540;
                let extra = (workedMinutes - standardMinutes) / 60;
                if (extra < 0) extra = 0;
                extraHours = extra.toFixed(2);
            }
        }
        const empId = document.getElementById("attEmpId").value.trim();
        const empName = document.getElementById("attEmp").value.trim();
        const date = document.getElementById("attDate").value.trim();

        // Prevent duplicate for same date and employee name
        const duplicate = attendance.some(a =>
            a.employee &&
            a.employee.trim().toLowerCase() === empName.toLowerCase() &&
            a.date === date
        );
        if (duplicate) {
            showNotif("Duplicate: Same employee name and date already exists!", true);
            return;
        }

        attendance.push({
            employeeId: empId,
            employee: empName,
            date: date,
            status: status,
            description: document.getElementById("attDesc").value,
            morningIn: document.getElementById("attMorningIn").value,
            morningOut: document.getElementById("attMorningOut").value,
            afternoonIn: document.getElementById("attAfternoonIn").value,
            eveningOut: document.getElementById("attEveningOut").value,
            extraHours: extraHours === "" ? undefined : parseFloat(extraHours)
        });
        
        // Update sessionStorage with the modified attendance data
        sessionStorage.setItem('attendanceData', JSON.stringify(attendance));
        
        showNotif("Attendance added!");
        this.reset();
        renderTable(document.getElementById("attSearch").value.toLowerCase());
        renderLateSummary(); // Update summary after add
    };
    document.getElementById("attSearch").oninput = function(){
        renderTable(this.value.toLowerCase());
    };
    document.getElementById("attExport").onclick = function(){
        let csv = "Employee ID,Employee,Date,Status,Description,Morning In,Morning Out,Afternoon In,Evening Out,Extra Hours\n";
        attendance.forEach(a=>{
            csv += `"${a.employeeId || ""}","${a.employee || ""}","${a.date || ""}","${a.status || ""}","${a.description||""}","${a.morningIn||""}","${a.morningOut||""}","${a.afternoonIn||""}","${a.eveningOut||""}","${typeof a.extraHours !== "undefined" && a.extraHours !== null ? a.extraHours : ""}"\n`;
        });
        const blob = new Blob([csv], {type: "csv"});
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = "attendance.csv";
        link.click();
    };
    document.getElementById("attSyncBiometric").onclick = function() {
        document.getElementById("biometricFile").click();
    };

    document.getElementById("biometricFile").onchange = function(e) {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = function(evt) {
            const lines = evt.target.result.split('\n');
            // Example CSV: EmployeeID,EmployeeName,Date,Status,Description,MorningIn,MorningOut,AfternoonIn,EveningOut,ExtraHours
            let added = 0;
            for (let i = 1; i < lines.length; i++) {
                const cols = lines[i].split(',');
                if (cols.length < 4) continue;
                // Try to support both old and new formats
                const [employeeId, employee, date, status, description, morningIn, morningOut, afternoonIn, eveningOut, extraHours] = cols.map(c => c.trim().replace(/^"|"$/g, ''));
                if (!employeeId || !date || !status) continue;
                // Avoid duplicate (same empName + date)
                if (!attendance.some(a =>
                    a.employee &&
                    a.employee.trim().toLowerCase() === (employee || "").trim().toLowerCase() &&
                    a.date === date
                )) {
                    let finalExtraHours = extraHours;
                    if (!finalExtraHours && morningIn && eveningOut) {
                        const [inH, inM] = morningIn.split(":").map(Number);
                        const [outH, outM] = eveningOut.split(":").map(Number);
                        const inMinutes = inH * 60 + inM;
                        const outMinutes = outH * 60 + outM;
                        const workedMinutes = outMinutes - inMinutes;
                        const standardMinutes = 540;
                        let extra = (workedMinutes - standardMinutes) / 60;
                        if (extra < 0) extra = 0;
                        finalExtraHours = extra.toFixed(2);
                    }
                    attendance.push({
                        employeeId,
                        employee,
                        date,
                        status,
                        description: description || "",
                        morningIn: morningIn || "",
                        morningOut: morningOut || "",
                        afternoonIn: afternoonIn || "",
                        eveningOut: eveningOut || "",
                        extraHours: finalExtraHours === "" || typeof finalExtraHours === "undefined" ? undefined : parseFloat(finalExtraHours)
                    });
                    added++;
                }
            }
            
            // Update sessionStorage with the modified attendance data
            sessionStorage.setItem('attendanceData', JSON.stringify(attendance));
            
            showNotif(`Biometric sync complete. ${added} records added.`);
            renderTable(document.getElementById("attSearch").value.toLowerCase());
            renderLateSummary(); // Update summary after import
        };
        reader.readAsText(file);
    };
    document.querySelectorAll("th[data-col]").forEach(th=>{
        th.onclick = function(){
            let col = this.getAttribute("data-col");
            if(sortCol === col) sortAsc = !sortAsc;
            else { sortCol = col; sortAsc = true; }
            renderTable(document.getElementById("attSearch").value.toLowerCase());
        };
    });
    
    // Add Update Attendance Report button
    const updateReportBtn = document.createElement('button');
    updateReportBtn.id = 'attUpdateReport';
    updateReportBtn.textContent = 'Update Attendance Report';
    updateReportBtn.style.marginLeft = '10px';
    updateReportBtn.style.padding = '8px 16px';
    updateReportBtn.style.backgroundColor = '#28a745';
    updateReportBtn.style.color = 'white';
    updateReportBtn.style.border = 'none';
    updateReportBtn.style.borderRadius = '4px';
    updateReportBtn.style.cursor = 'pointer';
    
    // Add the button after the export button
    const exportBtn = document.getElementById('attExport');
    exportBtn.parentNode.insertBefore(updateReportBtn, exportBtn.nextSibling);
    
    // Add click event to the button
    updateReportBtn.addEventListener('click', openAttendanceReport);
    
    renderTable();
    renderLateSummary();
}
// Leave Management Module
if (panelKey === "leave") {
    let sortCol = null, sortAsc = true;

    function saveLeaves() {
        localStorage.setItem('hrms_leaves', JSON.stringify(leaves));
    }

    // Helper function to calculate days between two dates
    function calculateDays(fromDate, toDate) {
        if (!fromDate || !toDate) return 0;
        const start = new Date(fromDate);
        const end = new Date(toDate);
        return Math.floor((end - start) / (1000 * 60 * 60 * 24)) + 1;
    }

    // Helper function to calculate approved days
    function calculateApprovedDays(status, totalDays) {
        if (status === "Approved") return totalDays;
        return 0;
    }

    function renderTable(filter = "") {
        let data = leaves.map((l, i) => ({ ...l, idx: i }));

        // Apply search filter
        if (filter) {
            data = data.filter(l =>
                (String(l.employeeId) || "").toLowerCase().includes(filter) ||
                (String(l.employee) || "").toLowerCase().includes(filter) ||
                (String(l.type) || "").toLowerCase().includes(filter) ||
                (String(l.status) || "").toLowerCase().includes(filter) ||
                (String(l.from) || "").toLowerCase().includes(filter) ||
                (String(l.to) || "").toLowerCase().includes(filter) ||
                (String(l.description) || "").toLowerCase().includes(filter) ||
                (String(l.approvedBy) || "").toLowerCase().includes(filter) ||
                (String(l.totalDays) || "").toLowerCase().includes(filter) ||
                (String(l.approvedDays) || "").toLowerCase().includes(filter)
            );
        }

        // Sorting
        if (sortCol) {
            data.sort((a, b) => {
                if (a[sortCol] < b[sortCol]) return sortAsc ? -1 : 1;
                if (a[sortCol] > b[sortCol]) return sortAsc ? 1 : -1;
                return 0;
            });
        }

        const tbody = document.getElementById("leaveTableBody");
        tbody.innerHTML = "";

        data.forEach(l => {
            // Calculate total days and approved days if not already present
            const totalDays = l.totalDays || calculateDays(l.from, l.to);
            const approvedDays = l.approvedDays !== undefined ? l.approvedDays : calculateApprovedDays(l.status, totalDays);

            let badgeClass = "";
            if (l.status === "Pending") badgeClass = "badge-pending";
            else if (l.status === "Approved") badgeClass = "badge-approved";
            else if (l.status === "Rejected") badgeClass = "badge-rejected";

            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td>${l.employeeId || ""}</td>
                <td>${l.employee || ""}</td>
                <td>${l.type || ""}</td>
                <td><span class="${badgeClass}">${l.status || ""}</span></td>
                <td>${l.from || ""}</td>
                <td>${l.to || ""}</td>
                <td>${totalDays}</td>
                <td>${approvedDays}</td>
                <td>${l.description || ""}</td>
                <td>${l.approvedBy || ""}</td>
                <td class="actions">
                    <button class="edit-btn" data-idx="${l.idx}">Edit</button>
                    <button class="delete-btn" data-idx="${l.idx}">Delete</button>
                </td>
            `;
            tbody.appendChild(tr);
        });

        // Edit button
        document.querySelectorAll(".edit-btn").forEach(btn => {
            btn.onclick = function () {
                let idx = this.dataset.idx;
                let l = leaves[idx];
                let tr = this.closest("tr");
                
                // Calculate total days and approved days
                const totalDays = calculateDays(l.from, l.to);
                const approvedDays = calculateApprovedDays(l.status, totalDays);

                tr.innerHTML = `
                    <td><input value="${l.employeeId || ""}" id="editEmpId${idx}" list="empIdList"></td>
                    <td><input value="${l.employee || ""}" id="editEmp${idx}" list="empNameList"></td>
                    <td>
                        <select id="editType${idx}">
                            <option${l.type === "Sick" ? " selected" : ""}>Sick</option>
                            <option${l.type === "Casual" ? " selected" : ""}>Casual</option>
                            <option${l.type === "Earned" ? " selected" : ""}>Earned</option>
                            <option${l.type === "Unpaid" ? " selected" : ""}>Unpaid</option>
                        </select>
                    </td>
                    <td>
                        <select id="editStatus${idx}">
                            <option${l.status === "Pending" ? " selected" : ""}>Pending</option>
                            <option${l.status === "Approved" ? " selected" : ""}>Approved</option>
                            <option${l.status === "Rejected" ? " selected" : ""}>Rejected</option>
                        </select>
                    </td>
                    <td><input type="date" value="${l.from || ""}" id="editFrom${idx}"></td>
                    <td><input type="date" value="${l.to || ""}" id="editTo${idx}"></td>
                    <td><input type="number" value="${totalDays}" id="editTotalDays${idx}" readonly></td>
                    <td><input type="number" value="${approvedDays}" id="editApprovedDays${idx}" readonly></td>
                    <td><input value="${l.description || ""}" id="editDesc${idx}"></td>
                    <td>
                        <select id="editApprovedBy${idx}">
                            <option${l.approvedBy === "Managing Director" ? " selected" : ""}>Managing Director</option>
                            <option${l.approvedBy === "Technical Director" ? " selected" : ""}>Technical Director</option>
                            <option${l.approvedBy === "Project Manager" ? " selected" : ""}>Project Manager</option>
                            <option${l.approvedBy === "HR General Manager" ? " selected" : ""}>HR General Manager</option>
                            <option${l.approvedBy === "Manager Commercial" ? " selected" : ""}>Manager Commercial</option>
                        </select>
                    </td>
                    <td class="actions">
                        <button class="save-btn" id="saveEdit${idx}">Save</button>
                        <button class="cancel-btn" id="cancelEdit${idx}">Cancel</button>
                    </td>
                `;

                // Auto-fill logic inside edit mode
                const employees = JSON.parse(localStorage.getItem("hrms_employees") || "[]");
                const empIdEdit = document.getElementById(`editEmpId${idx}`);
                const empNameEdit = document.getElementById(`editEmp${idx}`);

                empIdEdit.addEventListener("input", () => {
                    const emp = employees.find(e => String(e.id).toLowerCase() === empIdEdit.value.toLowerCase());
                    if (emp) empNameEdit.value = emp.name;
                });

                empNameEdit.addEventListener("input", () => {
                    const emp = employees.find(e => String(e.name).toLowerCase() === empNameEdit.value.toLowerCase());
                    if (emp) empIdEdit.value = emp.id;
                });

                // Update total days when dates change
                const editFrom = document.getElementById(`editFrom${idx}`);
                const editTo = document.getElementById(`editTo${idx}`);
                const editTotalDays = document.getElementById(`editTotalDays${idx}`);
                const editApprovedDays = document.getElementById(`editApprovedDays${idx}`);
                const editStatus = document.getElementById(`editStatus${idx}`);

                function updateDays() {
                    const newTotalDays = calculateDays(editFrom.value, editTo.value);
                    editTotalDays.value = newTotalDays;
                    
                    const newStatus = editStatus.value;
                    editApprovedDays.value = calculateApprovedDays(newStatus, newTotalDays);
                }

                editFrom.addEventListener("change", updateDays);
                editTo.addEventListener("change", updateDays);
                editStatus.addEventListener("change", updateDays);

                // Save edited row
                document.getElementById(`saveEdit${idx}`).onclick = function () {
                    const fromDate = editFrom.value;
                    const toDate = editTo.value;
                    const status = editStatus.value;
                    const totalDays = calculateDays(fromDate, toDate);
                    const approvedDays = calculateApprovedDays(status, totalDays);
                    
                    leaves[idx] = {
                        employeeId: empIdEdit.value,
                        employee: empNameEdit.value,
                        type: document.getElementById(`editType${idx}`).value,
                        status: status,
                        from: fromDate,
                        to: toDate,
                        totalDays: totalDays,
                        approvedDays: approvedDays,
                        description: document.getElementById(`editDesc${idx}`).value,
                        approvedBy: document.getElementById(`editApprovedBy${idx}`).value
                    };
                    saveLeaves();
                    showNotif("Leave updated!");
                    renderTable(document.getElementById("leaveSearch").value.toLowerCase());
                };

                document.getElementById(`cancelEdit${idx}`).onclick = function () {
                    renderTable(document.getElementById("leaveSearch").value.toLowerCase());
                };
            };
        });

        // Delete button
        document.querySelectorAll(".delete-btn").forEach(btn => {
            btn.onclick = function () {
                let idx = this.dataset.idx;
                if (confirm("Delete this leave?")) {
                    leaves.splice(idx, 1);
                    saveLeaves();
                    showNotif("Leave deleted!");
                    renderTable(document.getElementById("leaveSearch").value.toLowerCase());
                }
            };
        });
    }

    // Add Leave Form
    document.getElementById("addLeaveForm").onsubmit = function (e) {
        e.preventDefault();
        const fromDate = document.getElementById("leaveFrom").value;
        const toDate = document.getElementById("leaveTo").value;
        const status = document.getElementById("leaveStatus").value;
        const totalDays = calculateDays(fromDate, toDate);
        const approvedDays = calculateApprovedDays(status, totalDays);
        
        leaves.push({
            employeeId: document.getElementById("leaveEmpId").value,
            employee: document.getElementById("leaveEmp").value,
            type: document.getElementById("leaveType").value,
            status: status,
            from: fromDate,
            to: toDate,
            totalDays: totalDays,
            approvedDays: approvedDays,
            description: document.getElementById("leaveDesc").value,
            approvedBy: document.getElementById("leaveApprovedBy").value
        });
        saveLeaves();
        showNotif("Leave added!");
        this.reset();
        renderTable(document.getElementById("leaveSearch").value.toLowerCase());
    };

    // Auto-calculate total days when dates change
    const leaveFrom = document.getElementById("leaveFrom");
    const leaveTo = document.getElementById("leaveTo");
    const leaveTotalDays = document.getElementById("leaveTotalDays");
    const leaveApprovedDays = document.getElementById("leaveApprovedDays");
    const leaveStatus = document.getElementById("leaveStatus");

    function updateLeaveDays() {
        const fromDate = leaveFrom.value;
        const toDate = leaveTo.value;
        const status = leaveStatus.value;
        
        const totalDays = calculateDays(fromDate, toDate);
        leaveTotalDays.value = totalDays;
        
        const approvedDays = calculateApprovedDays(status, totalDays);
        leaveApprovedDays.value = approvedDays;
    }

    if (leaveFrom && leaveTo && leaveTotalDays && leaveApprovedDays && leaveStatus) {
        leaveFrom.addEventListener("change", updateLeaveDays);
        leaveTo.addEventListener("change", updateLeaveDays);
        leaveStatus.addEventListener("change", updateLeaveDays);
    }

    // Search filter
    document.getElementById("leaveSearch").oninput = function () {
        renderTable(this.value.toLowerCase());
    };

    // Export CSV
    document.getElementById("leaveExport").onclick = function () {
        let csv = "Employee ID,Employee,Type,Status,From,To,Total Days,Approved Days,Description,Approved By\n";
        leaves.forEach(l => {
            const totalDays = l.totalDays || calculateDays(l.from, l.to);
            const approvedDays = l.approvedDays !== undefined ? l.approvedDays : calculateApprovedDays(l.status, totalDays);
            
            csv += `"${l.employeeId || ""}","${l.employee || ""}","${l.type || ""}","${l.status || ""}","${l.from || ""}","${l.to || ""}","${totalDays}","${approvedDays}","${l.description || ""}","${l.approvedBy || ""}"\n`;
        });
        const blob = new Blob([csv], { type: "text/csv" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = "leaves.csv";
        link.click();
    };

    // Column sorting
    document.querySelectorAll("th[data-col]").forEach(th => {
        th.onclick = function () {
            let col = this.getAttribute("data-col");
            if (sortCol === col) sortAsc = !sortAsc;
            else { sortCol = col; sortAsc = true; }
            renderTable(document.getElementById("leaveSearch").value.toLowerCase());
        };
    });

    renderTable();
}

// Payroll Module
if (panelKey === "payroll") {
    let sortCol = null, sortAsc = true;
    
    // Load leaves data
    let leaves = JSON.parse(localStorage.getItem('hrms_leaves') || '[]');

    // --- Helper: Professional Tax ---
    function calcProfessionalTax(earnedGross) {
        earnedGross = parseFloat(earnedGross) || 0;
        if (earnedGross <= 15000) return 0;
        if (earnedGross <= 20000) return 150;
        return 200;
    }

    // --- Helper: Get Approved Leave Days ---
    function getApprovedLeaveDays(employeeId, fromDate, toDate) {
        const start = new Date(fromDate);
        const end = new Date(toDate);
        let leaveDays = 0;

        leaves.forEach(leave => {
            if (leave.employeeId === employeeId && leave.status === "Approved") {
                const leaveStart = new Date(leave.from);
                const leaveEnd = new Date(leave.to);

                // Check if the leave period overlaps with the payroll cycle
                if (leaveEnd >= start && leaveStart <= end) {
                    // Calculate the overlapping days
                    const overlapStart = new Date(Math.max(leaveStart, start));
                    const overlapEnd = new Date(Math.min(leaveEnd, end));
                    const days = Math.floor((overlapEnd - overlapStart) / (1000 * 60 * 60 * 24)) + 1;
                    leaveDays += days;
                }
            }
        });

        return leaveDays;
    }

    // --- Helper: Attendance with Late Deduction and Leaves ---
    function calculateAttendanceWithLeavesAndLates(attendance, leaves, empId, fromDate, toDate) {
        const start = new Date(fromDate);
        const end = new Date(toDate);
        const daysInCycle = Math.floor((end - start) / (1000 * 60 * 60 * 24)) + 1;

        // Get approved leave days
        const approvedLeaveDays = getApprovedLeaveDays(empId, fromDate, toDate);
        
        let presentDays = 0;
        let lateCount = 0;

        // Calculate present days from attendance records
        attendance.forEach(a => {
            const d = new Date(a.date);
            if (a.employeeId === empId && d >= start && d <= end) {
                if (a.status === "Present") presentDays++;
                if (a.status === "Half Day") presentDays += 0.5;
                if (a.status === "Late") {
                    presentDays++;
                    lateCount++;
                }
            }
        });

        // Add approved leave days to present days
        presentDays += approvedLeaveDays;

        // Deduct lates: 3 lates → 0.5 day
        const lateDeductionDays = Math.floor(lateCount / 3) * 0.5;
        presentDays -= lateDeductionDays;
        if (presentDays < 0) presentDays = 0;

        const absentDays = daysInCycle - presentDays;

        return { 
            daysInCycle, 
            presentDays, 
            absentDays, 
            lateCount, 
            lateDeductionDays,
            approvedLeaveDays 
        };
    }

    // --- Render Payroll Table ---
    function renderTable(filter = "") {
        let data = payroll.map((p, i) => ({ ...p, idx: i }));
        if (filter) {
            filter = filter.toLowerCase();
            data = data.filter(p =>
                (p.employeeId || "").toLowerCase().includes(filter) ||
                (p.employee || "").toLowerCase().includes(filter) ||
                (p.basic || "").toString().includes(filter) ||
                (p.allowances || "").toString().includes(filter) ||
                (p.gross || "").toString().includes(filter) ||
                (p.net || "").toString().includes(filter) ||
                (p.leaveDays || "").toString().includes(filter)
            );
        }
        if (sortCol) {
            data.sort((a, b) => {
                if (a[sortCol] < b[sortCol]) return sortAsc ? -1 : 1;
                if (a[sortCol] > b[sortCol]) return sortAsc ? 1 : -1;
                return 0;
            });
        }

        const tbody = document.getElementById("payrollTableBody");
        tbody.innerHTML = "";
        data.forEach(p => {
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td>${p.employeeId || ""}</td>
                <td>${p.employee || ""}</td>
                <td>${p.basic || ""}</td>
                <td>${p.allowances || ""}</td>
                <td>${p.gross || ""}</td>
                <td>${p.earnedBasic || ""}</td>
                <td>${p.earnedAllowances || ""}</td>
                <td>${p.earnedGross || ""}</td>
                <td>${p.daysInCycle || ""}</td>
                <td>${p.presentDays || ""}</td>
                <td>${p.leaveDays || ""}</td>
                <td>${p.absentDays || ""}</td>
                <td>${p.pf || ""}</td>
                <td>${p.esi || ""}</td>
                <td>${p.tds || ""}</td>
                <td>${p.professionalTax || ""}</td>
                <td>${p.advanced || ""}</td>
                <td>${p.deductions || ""}</td>
                <td>${p.net || ""}</td>
                <td class="actions">
                    <button class="edit-btn" data-idx="${p.idx}">Edit</button>
                    <button class="delete-btn" data-idx="${p.idx}">Delete</button>
                    <button class="export-btn" data-idx="${p.idx}" style="background:#2980b9;color:#fff;" title="Generate Payslip">Payslip</button>
                </td>
            `;
            tbody.appendChild(tr);
        });

        // --- Edit Button ---
        document.querySelectorAll(".edit-btn").forEach(btn => {
            btn.onclick = function () {
                let idx = this.dataset.idx;
                let p = payroll[idx];
                let tr = this.closest("tr");
                
                // Recalculate leave days using original dates from the record
                const leaveDays = getApprovedLeaveDays(p.employeeId, p.fromDate, p.toDate);
                
                tr.innerHTML = `
                    <td><input value="${p.employeeId || ""}" id="editEmpId${idx}"></td>
                    <td><input value="${p.employee || ""}" id="editEmp${idx}"></td>
                    <td><input type="number" value="${p.basic || ""}" id="editBasic${idx}"></td>
                    <td><input type="number" value="${p.allowances || ""}" id="editAllowances${idx}"></td>
                    <td><input type="number" value="${p.gross || ""}" id="editGross${idx}"></td>
                    <td><input type="number" value="${p.earnedBasic || ""}" id="editEarnedBasic${idx}"></td>
                    <td><input type="number" value="${p.earnedAllowances || ""}" id="editEarnedAllowances${idx}"></td>
                    <td><input type="number" value="${p.earnedGross || ""}" id="editEarnedGross${idx}"></td>
                    <td><input type="number" value="${p.daysInCycle || ""}" id="editDaysInCycle${idx}"></td>
                    <td><input type="number" value="${p.presentDays || ""}" id="editPresentDays${idx}"></td>
                    <td><input type="number" value="${leaveDays}" id="editLeaveDays${idx}" readonly></td>
                    <td><input type="number" value="${p.absentDays || ""}" id="editAbsentDays${idx}"></td>
                    <td><input type="number" value="${p.pf || ""}" id="editPF${idx}"></td>
                    <td><input type="number" value="${p.esi || ""}" id="editESI${idx}"></td>
                    <td><input type="number" value="${p.tds || ""}" id="editTDS${idx}"></td>
                    <td><input type="number" value="${p.professionalTax || ""}" id="editPT${idx}"></td>
                    <td><input type="number" value="${p.advanced || ""}" id="editAdvanced${idx}"></td>
                    <td><input type="number" value="${p.deductions || ""}" id="editDeductions${idx}"></td>
                    <td><input type="number" value="${p.net || ""}" id="editNet${idx}"></td>
                    <td class="actions">
                        <button class="save-btn" id="saveEdit${idx}">Save</button>
                        <button class="cancel-btn" id="cancelEdit${idx}">Cancel</button>
                    </td>
                `;
                
                document.getElementById(`saveEdit${idx}`).onclick = function () {
                    const empId = document.getElementById(`editEmpId${idx}`).value;
                    
                    // Recalculate leave days using original dates from the record
                    const leaveDays = getApprovedLeaveDays(empId, p.fromDate, p.toDate);
                    
                    payroll[idx] = {
                        employeeId: empId,
                        employee: document.getElementById(`editEmp${idx}`).value,
                        fromDate: p.fromDate, // Keep original dates
                        toDate: p.toDate,     // Keep original dates
                        basic: Number(document.getElementById(`editBasic${idx}`).value),
                        allowances: Number(document.getElementById(`editAllowances${idx}`).value),
                        gross: Number(document.getElementById(`editGross${idx}`).value),
                        earnedBasic: Number(document.getElementById(`editEarnedBasic${idx}`).value),
                        earnedAllowances: Number(document.getElementById(`editEarnedAllowances${idx}`).value),
                        earnedGross: Number(document.getElementById(`editEarnedGross${idx}`).value),
                        daysInCycle: Number(document.getElementById(`editDaysInCycle${idx}`).value),
                        presentDays: Number(document.getElementById(`editPresentDays${idx}`).value),
                        absentDays: Number(document.getElementById(`editAbsentDays${idx}`).value),
                        leaveDays: leaveDays,
                        pf: Number(document.getElementById(`editPF${idx}`).value),
                        esi: Number(document.getElementById(`editESI${idx}`).value),
                        tds: Number(document.getElementById(`editTDS${idx}`).value),
                        professionalTax: Number(document.getElementById(`editPT${idx}`).value),
                        advanced: Number(document.getElementById(`editAdvanced${idx}`).value),
                        deductions: Number(document.getElementById(`editDeductions${idx}`).value),
                        net: Number(document.getElementById(`editNet${idx}`).value)
                    };
                    showNotif("Payroll updated!");
                    renderTable(document.getElementById("payrollSearch").value.toLowerCase());
                };
                
                document.getElementById(`cancelEdit${idx}`).onclick = function () {
                    renderTable(document.getElementById("payrollSearch").value.toLowerCase());
                };
            };
        });

        // --- Delete Button ---
        document.querySelectorAll(".delete-btn").forEach(btn => {
            btn.onclick = function () {
                let idx = this.dataset.idx;
                if (confirm("Delete this payroll record?")) {
                    payroll.splice(idx, 1);
                    showNotif("Payroll deleted!");
                    renderTable(document.getElementById("payrollSearch").value.toLowerCase());
                }
            };
        });

        // --- Payslip Button ---
        document.querySelectorAll(".export-btn").forEach(btn => {
            btn.onclick = function () {
                let idx = this.dataset.idx;
                const p = payroll[idx];
                if (!window.payslips) window.payslips = [];
                const exists = window.payslips.some(ps =>
                    ps.employeeId === p.employeeId &&
                    ps.fromDate === p.fromDate &&
                    ps.toDate === p.toDate
                );
                if (exists) {
                    showNotif("Payslip already exists for this cycle!", true);
                    return;
                }
                window.payslips.push({ ...p });
                saveAllData();
                showNotif("Payslip generated!");
            };
        });
    }

    // --- Add Payroll Form ---
    document.getElementById("addPayrollForm").onsubmit = function (e) {
        e.preventDefault();
        const empId = document.getElementById("payEmpId").value;
        const empName = document.getElementById("payEmp").value;
        const fromDate = document.getElementById("payFrom").value;
        const toDate = document.getElementById("payTo").value;

        if (!fromDate || !toDate) {
            showNotif("Select a valid payroll cycle!", true);
            return;
        }

        // Calculate attendance with leaves
        const attendanceResult = calculateAttendanceWithLeavesAndLates(attendance, leaves, empId, fromDate, toDate);
        const { daysInCycle, presentDays, absentDays, approvedLeaveDays } = attendanceResult;

        const basic = Number(document.getElementById("payBasic").value) || 0;
        const allowances = Number(document.getElementById("payAllow").value) || 0;
        const gross = basic + allowances;
        const earnedBasic = (basic * presentDays) / daysInCycle;
        const earnedAllowances = (allowances * presentDays) / daysInCycle;
        const earnedGross = (gross * presentDays) / daysInCycle;

        // PF/ESI
        let pf = document.getElementById("payPFSelect").value === "auto" ? earnedBasic * 0.12 : Number(document.getElementById("payPF").value) || 0;
        let esi = document.getElementById("payESISelect").value === "auto" ? earnedGross * 0.0075 : Number(document.getElementById("payESI").value) || 0;
        let tds = Number(document.getElementById("payTDS").value) || 0;
        let professionalTax = calcProfessionalTax(earnedGross);
        let advanced = Number(document.getElementById("payAdvanced").value) || 0;

        const deductions = pf + esi + tds + professionalTax + advanced;
        const net = earnedGross - deductions;

        payroll.push({
            employeeId: empId,
            employee: empName,
            fromDate, toDate,
            basic, allowances, gross,
            earnedBasic: earnedBasic.toFixed(2),
            earnedAllowances: earnedAllowances.toFixed(2),
            earnedGross: earnedGross.toFixed(2),
            daysInCycle, presentDays, absentDays,
            leaveDays: approvedLeaveDays,
            pf: pf.toFixed(2),
            esi: esi.toFixed(2),
            tds, professionalTax, advanced,
            deductions: deductions.toFixed(2),
            net: net.toFixed(2)
        });
        showNotif("Payroll added!");
        this.reset();
        renderTable(document.getElementById("payrollSearch").value.toLowerCase());
    };

    // --- Auto Payroll for All Employees ---
    const autoPayrollBtn = document.getElementById("autoPayrollAll");
    if (autoPayrollBtn) {
        autoPayrollBtn.onclick = function () {
            const fromDate = document.getElementById("payFrom").value;
            const toDate = document.getElementById("payTo").value;
            if (!fromDate || !toDate) {
                showNotif("Select payroll cycle first!", true);
                return;
            }
            
            let added = 0;
            employees.forEach(emp => {
                // Calculate attendance with leaves
                const attendanceResult = calculateAttendanceWithLeavesAndLates(attendance, leaves, emp.id, fromDate, toDate);
                const { daysInCycle, presentDays, absentDays, approvedLeaveDays } = attendanceResult;

                const basic = Number(emp.basicSalary) || 0;
                const allowances = Number(emp.allowances) || 0;
                const gross = basic + allowances;
                const earnedBasic = (basic * presentDays) / daysInCycle;
                const earnedAllowances = (allowances * presentDays) / daysInCycle;
                const earnedGross = (gross * presentDays) / daysInCycle;

                let pf = emp.pfApplicable === "applicable" ? earnedBasic * 0.12 : 0;
                let esi = emp.esiApplicable === "applicable" ? earnedGross * 0.0075 : 0;
                let tds = 0;
                let professionalTax = calcProfessionalTax(earnedGross);
                let advanced = 0;
                const deductions = pf + esi + tds + professionalTax + advanced;
                const net = earnedGross - deductions;

                payroll.push({
                    employeeId: emp.id,
                    employee: emp.name,
                    fromDate, toDate,
                    basic, allowances, gross,
                    earnedBasic: earnedBasic.toFixed(2),
                    earnedAllowances: earnedAllowances.toFixed(2),
                    earnedGross: earnedGross.toFixed(2),
                    daysInCycle, presentDays, absentDays,
                    leaveDays: approvedLeaveDays,
                    pf: pf.toFixed(2),
                    esi: esi.toFixed(2),
                    tds, professionalTax, advanced,
                    deductions: deductions.toFixed(2),
                    net: net.toFixed(2)
                });
                added++;
            });
            showNotif(`Auto payroll complete. ${added} records added.`);
            renderTable(document.getElementById("payrollSearch").value.toLowerCase());
        };
    }

    // --- Reset Payroll ---
    const resetPayrollBtn = document.getElementById("resetPayroll");
    if (resetPayrollBtn) {
        resetPayrollBtn.onclick = function () {
            if (confirm("Reset all payroll records?")) {
                payroll = [];
                showNotif("Payroll records reset!");
                renderPanel("payroll");
            }
        };
    }

    // --- Payroll Search, Export & Sorting ---
    document.getElementById("payrollSearch").addEventListener("input", (e) => {
        renderTable(e.target.value.toLowerCase());
    });

    document.getElementById("payrollExport").addEventListener("click", () => {
        const headers = [
            "Employee ID", "Employee",
            "Basic", "Allowances", "Gross",
            "Earned Basic", "Earned Allowances", "Earned Gross",
            "Days in Cycle", "Present Days", "Leave Days", "Absent Days",
            "PF", "ESI", "TDS", "Professional Tax",
            "Advanced", "Total Deductions", "Net Pay"
        ];

        // Build CSV string
        let csv = headers.join(",") + "\n";
        payroll.forEach(p => {
            csv += [
                p.employeeId, p.employee,
                p.basic, p.allowances, p.gross,
                p.earnedBasic, p.earnedAllowances, p.earnedGross,
                p.daysInCycle, p.presentDays, p.leaveDays, p.absentDays,
                p.pf, p.esi, p.tds, p.professionalTax,
                p.advanced, p.deductions, p.net
            ].map(value => `"${value}"`).join(",") + "\n";
        });

        // Trigger file download
        const blob = new Blob([csv], { type: "text/csv" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = "payroll.csv";
        link.click();
    });

    document.querySelectorAll("th[data-col]").forEach(th => {
        th.addEventListener("click", () => {
            const col = th.getAttribute("data-col");
            if (sortCol === col) {
                sortAsc = !sortAsc;
            } else {
                sortCol = col;
                sortAsc = true;
            }
            renderTable(document.getElementById("payrollSearch").value.toLowerCase());
        });
    });

    // --- Auto-calculate leave days when employee or dates change ---
    const payEmpId = document.getElementById("payEmpId");
    const payFrom = document.getElementById("payFrom");
    const payTo = document.getElementById("payTo");
    const payLeaveDays = document.getElementById("payLeaveDays");

    function updateLeaveDays() {
        const empId = payEmpId.value;
        const fromDate = payFrom.value;
        const toDate = payTo.value;

        if (empId && fromDate && toDate) {
            const leaveDays = getApprovedLeaveDays(empId, fromDate, toDate);
            payLeaveDays.value = leaveDays;
        } else {
            payLeaveDays.value = "";
        }
    }

    if (payEmpId && payFrom && payTo && payLeaveDays) {
        payEmpId.addEventListener("input", updateLeaveDays);
        payFrom.addEventListener("change", updateLeaveDays);
        payTo.addEventListener("change", updateLeaveDays);
    }

    // --- Auto-calculate gross salary ---
    const payBasic = document.getElementById("payBasic");
    const payAllow = document.getElementById("payAllow");
    const payGross = document.getElementById("payGross");

    function updateGross() {
        const basic = parseFloat(payBasic.value) || 0;
        const allowances = parseFloat(payAllow.value) || 0;
        payGross.value = basic + allowances;
    }

    if (payBasic && payAllow && payGross) {
        payBasic.addEventListener("input", updateGross);
        payAllow.addEventListener("input", updateGross);
    }

    // --- Update PF/ESI fields based on selection ---
    const payPFSelect = document.getElementById("payPFSelect");
    const payPF = document.getElementById("payPF");
    const payESISelect = document.getElementById("payESISelect");
    const payESI = document.getElementById("payESI");

    function updatePF() {
        if (payPFSelect.value === "auto") {
            payPF.readOnly = true;
            payPF.value = "";
        } else if (payPFSelect.value === "none") {
            payPF.readOnly = true;
            payPF.value = 0;
        } else {
            payPF.readOnly = false;
            payPF.value = "";
        }
    }

    function updateESI() {
        if (payESISelect.value === "auto") {
            payESI.readOnly = true;
            payESI.value = "";
        } else if (payESISelect.value === "none") {
            payESI.readOnly = true;
            payESI.value = 0;
        } else {
            payESI.readOnly = false;
            payESI.value = "";
        }
    }

    if (payPFSelect && payPF) {
        payPFSelect.addEventListener("change", updatePF);
    }

    if (payESISelect && payESI) {
        payESISelect.addEventListener("change", updateESI);
    }

    // --- Update TDS field based on selection ---
    const payTDSSelect = document.getElementById("payTDSSelect");
    const payTDS = document.getElementById("payTDS");

    function updateTDS() {
        if (payTDSSelect.value === "none") {
            payTDS.readOnly = true;
            payTDS.value = 0;
        } else {
            payTDS.readOnly = false;
            payTDS.value = "";
        }
    }

    if (payTDSSelect && payTDS) {
        payTDSSelect.addEventListener("change", updateTDS);
    }

    // --- Update absent days field based on selection ---
    const payAbsentDaysSelect = document.getElementById("payAbsentDaysSelect");
    const payAbsentDays = document.getElementById("payAbsentDays");

    function updateAbsentDays() {
        if (payAbsentDaysSelect.value === "auto") {
            payAbsentDays.readOnly = true;
            payAbsentDays.value = "";
        } else if (payAbsentDaysSelect.value === "none") {
            payAbsentDays.readOnly = true;
            payAbsentDays.value = 0;
        } else {
            payAbsentDays.readOnly = false;
            payAbsentDays.value = "";
        }
    }

    if (payAbsentDaysSelect && payAbsentDays) {
        payAbsentDaysSelect.addEventListener("change", updateAbsentDays);
    }

    renderTable();
}
// Performance Module
if(panelKey==="performance") {
if(!window.performanceData) window.performanceData = [
{ employee: "Alice Smith", period: "2025-06", score: 9, reviewer: "HR Manager", remarks: "Excellent" },
{ employee: "Bob Johnson", period: "2025-06", score: 7, reviewer: "IT Lead", remarks: "Good, needs improvement in punctuality" }
];
let sortCol = null, sortAsc = true;
function renderTable(filter="") {
let data = performanceData.map((p,i)=>({...p, idx:i}));
if(filter) {
data = data.filter(p =>
p.employee.toLowerCase().includes(filter) ||
p.period.toLowerCase().includes(filter) ||
String(p.score).includes(filter) ||
p.reviewer.toLowerCase().includes(filter) ||
(p.remarks||"").toLowerCase().includes(filter)
);
}
if(sortCol) {
data.sort((a,b) => {
if(a[sortCol] < b[sortCol]) return sortAsc ? -1 : 1;
if(a[sortCol] > b[sortCol]) return sortAsc ? 1 : -1;
return 0;
});
}
const tbody = document.getElementById("perfTableBody");
tbody.innerHTML = "";
data.forEach(p => {
const tr = document.createElement("tr");
tr.innerHTML = `
<td>${p.employee}</td>
<td>${p.period}</td>
<td>${p.score}</td>
<td>${p.reviewer}</td>
<td>${p.remarks||""}</td>
<td class="actions">
<button class="edit-btn" data-idx="${p.idx}">Edit</button>
<button class="delete-btn" data-idx="${p.idx}">Delete</button>
</td>
`;
tbody.appendChild(tr);
});
document.querySelectorAll(".edit-btn").forEach(btn=>{
btn.onclick = function(){
let idx = this.dataset.idx;
let p = performanceData[idx];
let tr = this.closest("tr");
tr.innerHTML = `
<td><input value="${p.employee}" id="editEmp${idx}"></td>
<td><input type="month" value="${p.period}" id="editPeriod${idx}"></td>
<td><input type="number" min="1" max="10" value="${p.score}" id="editScore${idx}"></td>
<td><input value="${p.reviewer}" id="editReviewer${idx}"></td>
<td><input value="${p.remarks||""}" id="editRemarks${idx}"></td>
<td class="actions">
<button class="save-btn" id="saveEdit${idx}">Save</button>
<button class="cancel-btn" id="cancelEdit${idx}">Cancel</button>
</td>
`;
document.getElementById(`saveEdit${idx}`).onclick = function(){
performanceData[idx] = {
employee: document.getElementById(`editEmp${idx}`).value,
period: document.getElementById(`editPeriod${idx}`).value,
score: Number(document.getElementById(`editScore${idx}`).value),
reviewer: document.getElementById(`editReviewer${idx}`).value,
remarks: document.getElementById(`editRemarks${idx}`).value
};
showNotif("Appraisal updated!");
renderTable(document.getElementById("perfSearch").value.toLowerCase());
};
document.getElementById(`cancelEdit${idx}`).onclick = function(){
renderTable(document.getElementById("perfSearch").value.toLowerCase());
};
};
});
document.querySelectorAll(".delete-btn").forEach(btn=>{
btn.onclick = function(){
let idx = this.dataset.idx;
if(confirm("Delete this appraisal?")) {
performanceData.splice(idx,1);
showNotif("Appraisal deleted!");
renderTable(document.getElementById("perfSearch").value.toLowerCase());
}
};
});
}
document.getElementById("addPerfForm").onsubmit = function(e){
e.preventDefault();
performanceData.push({
employee: document.getElementById("perfEmp").value,
period: document.getElementById("perfPeriod").value,
score: Number(document.getElementById("perfScore").value),
reviewer: document.getElementById("perfReviewer").value,
remarks: document.getElementById("perfRemarks").value
});
showNotif("Appraisal added!");
this.reset();
renderTable(document.getElementById("perfSearch").value.toLowerCase());
};
document.getElementById("perfSearch").oninput = function(){
renderTable(this.value.toLowerCase());
};
document.getElementById("perfExport").onclick = function(){
let csv = "Employee,Period,Score,Reviewer,Remarks\n";
performanceData.forEach(p=>{
csv += `"${p.employee}","${p.period}","${p.score}","${p.reviewer}","${p.remarks||""}"\n`;
});
const blob = new Blob([csv], {type: "text/csv"});
const link = document.createElement("a");
link.href = URL.createObjectURL(blob);
link.download = "appraisals.csv";
link.click();
};
document.querySelectorAll("th[data-col]").forEach(th=>{
th.onclick = function(){
let col = this.getAttribute("data-col");
if(sortCol === col) sortAsc = !sortAsc;
else { sortCol = col; sortAsc = true; }
renderTable(document.getElementById("perfSearch").value.toLowerCase());
};
});
renderTable();
}

// Documents Module
if(panelKey === "documents") {
// Sample documents data
if(!window.documentsData) window.documentsData = [
{ employeeId: "E001", employee: "Alice Smith", type: "Resume", name: "Alice_Resume.pdf", date: "2025-06-01", link: "https://example.com/alice_resume.pdf" },
{ employeeId: "E002", employee: "Bob Johnson", type: "ID Proof", name: "Bob_ID.jpg", date: "2025-05-20", link: "https://example.com/bob_id.jpg" }
];

// Employee database (from localStorage or sample)
const employees = JSON.parse(localStorage.getItem('hrms_employees') || '[]');

// Populate datalists for auto-fill
const docEmpInput = document.getElementById("docEmp");
const docEmpIdInput = document.getElementById("docEmpId");
const docEmpList = document.getElementById("docEmpList");
const docEmpIdList = document.getElementById("docEmpIdList");

employees.forEach(emp => {
const optName = document.createElement("option");
optName.value = emp.name;
docEmpList.appendChild(optName);

const optId = document.createElement("option");
optId.value = emp.id;
docEmpIdList.appendChild(optId);
});

// Auto-fill Name when ID is selected
docEmpIdInput.addEventListener("input", function(){
const emp = employees.find(e => e.id === this.value);
if(emp) docEmpInput.value = emp.name;
});

// Auto-fill ID when Name is selected
docEmpInput.addEventListener("input", function(){
const emp = employees.find(e => e.name === this.value);
if(emp) docEmpIdInput.value = emp.id;
});

let sortCol = null, sortAsc = true;

function renderTable(filter="") {
let data = documentsData.map((d,i)=>({...d, idx:i}));

if(filter) {
data = data.filter(d =>
d.employeeId.toLowerCase().includes(filter) ||
d.employee.toLowerCase().includes(filter) ||
d.type.toLowerCase().includes(filter) ||
d.name.toLowerCase().includes(filter) ||
d.date.toLowerCase().includes(filter) ||
d.link.toLowerCase().includes(filter)
);
}

if(sortCol) {
data.sort((a,b) => {
if(a[sortCol] < b[sortCol]) return sortAsc ? -1 : 1;
if(a[sortCol] > b[sortCol]) return sortAsc ? 1 : -1;
return 0;
});
}

const tbody = document.getElementById("docTableBody");
tbody.innerHTML = "";

data.forEach(d => {
const tr = document.createElement("tr");
tr.innerHTML = `
<td>${d.employeeId}</td>
<td>${d.employee}</td>
<td>${d.type}</td>
<td>${d.name}</td>
<td>${d.date}</td>
<td><a href="${d.link}" target="_blank">View</a></td>
<td class="actions">
<button class="edit-btn" data-idx="${d.idx}">Edit</button>
<button class="delete-btn" data-idx="${d.idx}">Delete</button>
</td>
`;
tbody.appendChild(tr);
});

// Edit buttons
document.querySelectorAll(".edit-btn").forEach(btn => {
btn.onclick = function() {
const idx = this.dataset.idx;
const d = documentsData[idx];
const tr = this.closest("tr");
tr.innerHTML = `
<td><input value="${d.employeeId}" id="editEmpId${idx}" list="docEmpIdList"></td>
<td><input value="${d.employee}" id="editEmp${idx}" list="docEmpList"></td>
<td><input value="${d.type}" id="editType${idx}"></td>
<td><input value="${d.name}" id="editName${idx}"></td>
<td><input type="date" value="${d.date}" id="editDate${idx}"></td>
<td><input value="${d.link}" id="editLink${idx}"></td>
<td class="actions">
<button class="save-btn" id="saveEdit${idx}">Save</button>
<button class="cancel-btn" id="cancelEdit${idx}">Cancel</button>
</td>
`;
// Auto-fill inside edit row
const editEmpIdInput = document.getElementById(`editEmpId${idx}`);
const editEmpNameInput = document.getElementById(`editEmp${idx}`);
editEmpIdInput.addEventListener("input", ()=> {
const emp = employees.find(e => e.id === editEmpIdInput.value);
if(emp) editEmpNameInput.value = emp.name;
});
editEmpNameInput.addEventListener("input", ()=> {
const emp = employees.find(e => e.name === editEmpNameInput.value);
if(emp) editEmpIdInput.value = emp.id;
});

document.getElementById(`saveEdit${idx}`).onclick = function(){
documentsData[idx] = {
employeeId: document.getElementById(`editEmpId${idx}`).value,
employee: document.getElementById(`editEmp${idx}`).value,
type: document.getElementById(`editType${idx}`).value,
name: document.getElementById(`editName${idx}`).value,
date: document.getElementById(`editDate${idx}`).value,
link: document.getElementById(`editLink${idx}`).value
};
showNotif("Document updated!");
renderTable(document.getElementById("docSearch").value.toLowerCase());
};
document.getElementById(`cancelEdit${idx}`).onclick = function(){
renderTable(document.getElementById("docSearch").value.toLowerCase());
};
};
});

// Delete buttons
document.querySelectorAll(".delete-btn").forEach(btn => {
btn.onclick = function() {
const idx = this.dataset.idx;
if(confirm("Delete this document?")) {
documentsData.splice(idx,1);
showNotif("Document deleted!");
renderTable(document.getElementById("docSearch").value.toLowerCase());
}
};
});
}

// Add document form submit
document.getElementById("addDocForm").onsubmit = function(e){
e.preventDefault();
documentsData.push({
employeeId: docEmpIdInput.value,
employee: docEmpInput.value,
type: document.getElementById("docType").value,
name: document.getElementById("docName").value,
date: document.getElementById("docDate").value,
link: document.getElementById("docLink").value
});
showNotif("Document added!");
this.reset();
renderTable(document.getElementById("docSearch").value.toLowerCase());
};

// Search input
document.getElementById("docSearch").oninput = function(){
renderTable(this.value.toLowerCase());
};

// Export CSV
document.getElementById("docExport").onclick = function(){
let csv = "Employee ID,Employee,Type,Name,Date,Link\n";
documentsData.forEach(d=>{
csv += `"${d.employeeId}","${d.employee}","${d.type}","${d.name}","${d.date}","${d.link}"\n`;
});
const blob = new Blob([csv], {type: "text/csv"});
const link = document.createElement("a");
link.href = URL.createObjectURL(blob);
link.download = "documents.csv";
link.click();
};

// Sortable headers
document.querySelectorAll("th[data-col]").forEach(th=>{
th.onclick = function(){
let col = this.getAttribute("data-col");
if(sortCol === col) sortAsc = !sortAsc;
else { sortCol = col; sortAsc = true; }
renderTable(document.getElementById("docSearch").value.toLowerCase());
};
});

renderTable();
}

// Payslips Module
if(panelKey==="payslips") {
function renderTable(filterEmpId = "", filterMonth = "") {
    let data = (window.payslips || []).map((p, i) => ({...p, idx: i}));
    if (filterEmpId) data = data.filter(p => p.employeeId === filterEmpId);
    if (filterMonth) data = data.filter(p => (p.month || "").startsWith(filterMonth));
    const tbody = document.getElementById("payslipsTableBody");
    tbody.innerHTML = "";
    if (data.length === 0) {
        tbody.innerHTML = `<tr><td colspan="13" style="text-align:center;color:#888;">No payslips found.</td></tr>`;
        return;
    }
    data.forEach(p => {
        const emp = employees.find(e => e.id === p.employeeId) || {};
        // Prefer auto payroll data if available
        let pr = payroll.find(pr => pr.employeeId === p.employeeId && pr.month === p.month);
        if (!pr) {
            // fallback: try to find auto payroll record (auto entered)
            pr = payroll.find(pr => pr.employeeId === p.employeeId && pr.month === p.month && pr.autoEntered);
        }
        let presentDays = p.presentDays;
        let absentDays = p.absentDays;
        let daysInMonth = p.daysInMonth;
        let earnedBasic = p.earnedBasic;
        let earnedAllowances = p.earnedAllowances;
        let earnedGross = p.earnedGross;
        let deductions = p.deductions;
        let net = p.net;
        if (pr) {
            presentDays = pr.presentDays;
            absentDays = pr.absentDays;
            daysInMonth = pr.daysInMonth;
            earnedBasic = pr.earnedBasic;
            earnedAllowances = pr.earnedAllowances;
            earnedGross = pr.earnedGross;
            deductions = pr.deductions;
            net = pr.net;
        } else if (typeof presentDays === "undefined" || typeof absentDays === "undefined" || typeof daysInMonth === "undefined") {
            if (p.month) {
                daysInMonth = new Date(parseInt(p.month.split('-')[0]), parseInt(p.month.split('-')[1]), 0).getDate();
            }
        }
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${p.employeeId || ""}</td>
            <td>${emp.name || p.employee || ""}</td>
            <td>${p.month || ""}</td>
            <td>${earnedBasic || p.basic || 0}</td>
            <td>${earnedAllowances || p.allowances || 0}</td>
            <td>${earnedGross || p.gross || 0}</td>
            <td>${deductions || 0}</td>
            <td><b>${net || 0}</b></td>
            <td>${typeof presentDays !== "undefined" ? presentDays : ""}</td>
            <td>${typeof absentDays !== "undefined" ? absentDays : ""}</td>
            <td>${daysInMonth || ""}</td>
            <td>${emp.department || p.empdept || ""}</td>
            <td>${typeof p.advanced !== "undefined" ? p.advanced : ""}</td>
            <td>${typeof p.note !== "undefined" ? p.note : ""}</td>
            <td>
                <button class="print-payslip-btn" data-idx="${p.idx}">Print</button>
                <button class="download-payslip-btn" data-idx="${p.idx}">Download PDF</button>
                <button class="edit-btn edit-payslip-btn" data-idx="${p.idx}">Edit</button>
                <button class="delete-btn delete-payslip-btn" data-idx="${p.idx}">Delete</button>
            </td>
        `;
        tbody.appendChild(tr);
    });

    // Print button functionality
    document.querySelectorAll(".print-payslip-btn").forEach(btn => {
        btn.onclick = function() {
            const idx = this.dataset.idx;
            const payslipData = data.find(p => p.idx == idx);
            const htmlContent = generatePayslipHTML(payslipData);
            
            const win = window.open("", "_blank");
            win.document.write(`
                <html>
                    <head>
                        <title>Payslip</title>
                        <style>
                            body { font-size: 0.95rem; margin: 0; }
                            table { width: 100%; border-collapse: collapse; font-size: 0.95rem; }
                            th, td { padding: 2px 6px; border:1px solid #223043; }
                            th { background: #eaf1fb; }
                        </style>
                    </head>
                    <body>${htmlContent}</body>
                </html>
            `);
            win.print();
            win.close();
        };
    });

    // Download PDF button functionality
    document.querySelectorAll(".download-payslip-btn").forEach(btn => {
        btn.onclick = function() {
            const idx = this.dataset.idx;
            const payslipData = data.find(p => p.idx == idx);
            downloadPayslipAsPDF(payslipData);
        };
    });
}

// Helper function to generate payslip HTML
function generatePayslipHTML(p) {
    const emp = employees.find(e => e.id === p.employeeId) || {};
    const monthYear = p.month ? p.month.split('-') : ["", ""];
    const month = monthYear[1] ? new Date(0, parseInt(monthYear[1])-1).toLocaleString('default', { month: 'long' }) : "";
    const fromDate = p.fromDate || (p.month ? `${monthYear[0]}-${monthYear[1]}-01` : "");
    const toDate = p.toDate || (p.month ? `${monthYear[0]}-${monthYear[1]}-${new Date(parseInt(monthYear[0]), parseInt(monthYear[1]), 0).getDate()}` : "");
    const year = monthYear[0] || "";
    let daysInMonth = p.daysInMonth;
    if (!daysInMonth && p.month) {
        daysInMonth = new Date(parseInt(p.month.split('-')[0]), parseInt(p.month.split('-')[1]), 0).getDate();
    }

    // Emoluments
    const basic = parseFloat(p.earnedBasic) || 0;
    const hra = parseFloat(p.hra)|| 0;
    const conveyance = parseFloat(p.conveyance) || 0;
    const medical = parseFloat(p.medical) || 0;
    const vehicle = parseFloat(p.vehicle)|| 0;
    const special = parseFloat(p.special) || 0;
    const other = parseFloat(p.earnedAllowances)||0;
    const consolidated = parseFloat(p.consolidated) || 0;

    // Deductions
    const professionalTax = parseFloat(p.professionalTax) || 0;
    const gpf = parseFloat(p.gpf) || 0;
    const cpf = parseFloat(p.pf) || 0;
    const salaryAdv = parseFloat(p.advanced) || 0;
    const esi = parseFloat(p.esi) || 0;
    const groupInsurance = parseFloat(p.groupInsurance) || 0;
    const tds = parseFloat(p.tds) || 0;
    const leaveDeduct = parseFloat(p.leaveDeduct) || 0;

    // Totals
    let gross = typeof p.earnedGross !== "undefined" ? parseFloat(p.earnedGross) : (
        hra + conveyance + conveyance + medical + vehicle + special + other + consolidated
    );
    let totalDeductions = typeof p.deductions !== "undefined" ? parseFloat(p.deductions) : (
        professionalTax + gpf + (typeof p.pf !== "undefined" ? parseFloat(p.pf) : cpf) + salaryAdv + esi + groupInsurance + tds + leaveDeduct
    );
    let netPay = typeof p.net !== "undefined" ? parseFloat(p.net) : (gross - totalDeductions);

    // Prefer auto payroll data
    let pr = payroll.find(pr => pr.employeeId === p.employeeId && pr.month === p.month);
    if (!pr) {
        pr = payroll.find(pr => pr.employeeId === p.employeeId && pr.month === p.month && pr.autoEntered);
    }
    let presentDays = p.presentDays;
    let absentDays = p.absentDays;
    if (pr) {
        presentDays = pr.presentDays;
        absentDays = pr.absentDays;
        daysInMonth = pr.daysInMonth;
    } else if (typeof presentDays === "undefined" || typeof absentDays === "undefined" || typeof daysInMonth === "undefined") {
        if (p.month) {
            daysInMonth = new Date(parseInt(p.month.split('-')[0]), parseInt(p.month.split('-')[1]), 0).getDate();
        }
    }

    return `
        <div style="text-align:left; padding: 20px;">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px;">
                <img src="https://www.essen.org.in/images/essen.jpg" alt="Company Logo" style="height:75px; margin-right:20px;">
                <div style="text-align: right;">
                    <div style="font-weight: bold; font-size: 1.5rem;">
                        Essen Electronic Systems Private Limited
                    </div>
                    <div style="font-size: 0.95rem;">
                        Visakhapatnam - 530012
                    </div>
                    <div style="font-size: 0.95rem;">
                        A/C Mail id: accounts@essen.org.in
                    </div>
                </div>
            </div>

            <h2 style="text-align:center;margin:0.8rem 0 0.5rem 0;font-size:1.90rem;">Pay Slip</h2>
            <table style="width:100%;margin-bottom:0.5rem;font-size:0.95rem;border:1px solid #bfc9d1;border-radius:8px;">
                <tr>
                    <td style="border:1px solid #bfc9d1;"><b>Employee Name:</b> ${emp.name || p.employee || ""}</td>
                    <td style="border:1px solid #bfc9d1;"><b>Month:</b> ${fromDate}</td>
                </tr>
                <tr>
                    <td style="border:1px solid #bfc9d1;"><b>Employee Code:</b> ${p.employeeId || ""}</td>
                    <td style="border:1px solid #bfc9d1;"><b>Year:</b> ${year}</td>
                </tr>
                <tr>
                    <td style="border:1px solid #bfc9d1;"><b>Designation:</b> ${emp.department || p.empdept || ""}</td>
                    <td style="border:1px solid #bfc9d1;"><b>Period:</b> ${fromDate} to ${toDate}</td>
                </tr>
                <tr>
                    <td style="border:1px solid #bfc9d1;"><b>Date of Joining:</b> ${emp.doj || ""}</td>
                    <td style="border:1px solid #bfc9d1;"><b>LOP:</b> ${typeof absentDays !== "undefined" ? absentDays : ""}</td>
                </tr>
                <tr>
                    <td style="border:1px solid #bfc9d1;"></td>
                    <td style="border:1px solid #bfc9d1;"><b>Paid Days:</b> ${typeof presentDays !== "undefined" ? presentDays : ""}</td>
                </tr>
            </table>
            <table style="width:100%;border:2px solid #223043;border-collapse:collapse;font-size:0.95rem;">
                <tr style="background:#eaf1fb;">
                    <th style="width:50%;border:1px solid #223043;">Emoluments</th>
                    <th style="border:1px solid #223043;">Amount</th>
                    <th style="width:50%;border:1px solid #223043;">Deductions</th>
                    <th style="border:1px solid #223043;">Amount</th>
                </tr>
                <tr>
                    <td style="border:1px solid #223043;">Basic Pay</td><td style="border:1px solid #223043;">₹${basic.toFixed(2)}</td>
                    <td style="border:1px solid #223043;">Profession Tax</td><td style="border:1px solid #223043;">₹${professionalTax.toFixed(2)}</td>
                </tr>
                <tr>
                    <td style="border:1px solid #223043;">House Rent Allowance</td><td style="border:1px solid #223043;">₹${hra.toFixed(2)}</td>
                    <td style="border:1px solid #223043;">General Provident Fund</td><td style="border:1px solid #223043;">₹${gpf.toFixed(2)}</td>
                </tr>
                <tr>
                    <td style="border:1px solid #223043;">Conveyance Allowances</td><td style="border:1px solid #223043;">₹${conveyance.toFixed(2)}</td>
                    <td style="border:1px solid #223043;">Contributory Provident Fund</td><td style="border:1px solid #223043;">₹${cpf.toFixed(2)}</td>
                </tr>
                <tr>
                    <td style="border:1px solid #223043;">Medical Allowance</td><td style="border:1px solid #223043;">₹${medical.toFixed(2)}</td>
                    <td style="border:1px solid #223043;">Salary Advanced</td><td style="border:1px solid #223043;">₹${salaryAdv.toFixed(2)}</td>
                </tr>
                <tr>
                    <td style="border:1px solid #223043;">Vehicle Allowance</td><td style="border:1px solid #223043;">₹${vehicle.toFixed(2)}</td>
                    <td style="border:1px solid #223043;">ESIC</td><td style="border:1px solid #223043;">₹${esi.toFixed(2)}</td>
                </tr>
                <tr>
                    <td style="border:1px solid #223043;">Special Allowance/Incentive</td><td style="border:1px solid #223043;">₹${special.toFixed(2)}</td>
                    <td style="border:1px solid #223043;">Group Insurance</td><td style="border:1px solid #223043;">₹${groupInsurance.toFixed(2)}</td>
                </tr>
                <tr>
                    <td style="border:1px solid #223043;">Other Allowance</td><td style="border:1px solid #223043;">₹${other.toFixed(2)}</td>
                    <td style="border:1px solid #223043;">Income Tax(TDS)</td><td style="border:1px solid #223043;">₹${tds.toFixed(2)}</td>
                </tr>
                <tr>
                    <td style="border:1px solid #223043;">Consolidated Salary</td><td style="border:1px solid #223043;">₹${consolidated.toFixed(2)}</td>
                    <td style="border:1px solid #223043;">Leave Deductions</td><td style="border:1px solid #223043;">₹${leaveDeduct.toFixed(2)}</td>
                </tr>
                <tr style="background:#eaf1fb;">
                    <td colspan="2" style="text-align:right;border:1px solid #223043;"><b>Total Deductions</b></td>
                    <td colspan="2" style="text-align:right;border:1px solid #223043;"><b>₹${totalDeductions.toFixed(2)}</b></td>
                </tr>
                <tr>
                    <td colspan="2" style="text-align:right;border:1px solid #223043;"><b>Gross Pay</b></td>
                    <td colspan="2" style="text-align:right;border:1px solid #223043;"><b>₹${gross.toFixed(2)}</b></td>
                </tr>
                <tr>
                    <td colspan="2" style="text-align:right;border:1px solid #223043;"><b>Net Pay</b></td>
                    <td colspan="2" style="text-align:right;border:1px solid #223043;"><b>₹${netPay.toFixed(2)}</b></td>
                </tr>
            </table>
            <div style="margin:0.5rem 0 0.1rem 0;font-size:0.92rem;"><b>Amounts in Words:</b> Rupees</div>
            <div style="font-size:0.9rem;color:#888;margin-bottom:0.5rem;">
                <b>Note:</b> This Pay slip is issued on his request and is subject to all terms and conditions of the company.
            </div>
            <div style="text-align:right;font-weight:bold;margin-top:1rem;font-size:0.95rem;">
                Essen Electronic Systems Private Limited<br><br>
                <div style="text-align:right;font-weight:bold;margin-top:1rem;font-size:0.95rem;">
                    <br><br>
                    Sr. Accountant
                </div>
            </div>
        </div>
    `;
}

// Function to download payslip as PDF
function downloadPayslipAsPDF(p) {
    const { jsPDF } = window.jspdf;
    const htmlContent = generatePayslipHTML(p);
    
    // Create a temporary container
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlContent;
    tempDiv.style.position = 'absolute';
    tempDiv.style.left = '-9999px';
    document.body.appendChild(tempDiv);
    
    // Generate PDF
    html2canvas(tempDiv, {
        scale: 2,
        logging: false,
        useCORS: true
    }).then(canvas => {
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const imgProps = pdf.getImageProperties(imgData);
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
        
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        pdf.save(`Payslip_${p.employeeId || ""}_${p.month || ""}.pdf`);
        
        // Clean up
        document.body.removeChild(tempDiv);
    });
}

// Filter form
document.getElementById("payslipFilterForm").onsubmit = function(e) {
    e.preventDefault();
    const empId = document.getElementById("payslipEmp").value;
    const month = document.getElementById("payslipMonth").value;
    renderTable(empId, month);
};

// Export all payslips as CSV
document.getElementById("payslipExport").onclick = function() {
    let csv = "Employee ID,Name,Month,Basic,Allowances,Gross,Deductions,Net Pay,Present Days,Absent Days,Days in Month,Department\n";
    (window.payslips || []).forEach(p => {
        const emp = employees.find(e => e.id === p.employeeId) || {};
        // Prefer auto payroll data if available
        let pr = payroll.find(pr => pr.employeeId === p.employeeId && pr.month === p.month);
        if (!pr) {
            pr = payroll.find(pr => pr.employeeId === p.employeeId && pr.month === p.month && pr.autoEntered);
        }
        let presentDays = p.presentDays;
        let absentDays = p.absentDays;
        let daysInMonth = p.daysInMonth;
        let earnedBasic = p.earnedBasic;
        let earnedAllowances = p.earnedAllowances;
        let earnedGross = p.earnedGross;
        let deductions = p.deductions;
        let net = p.net;
        if (pr) {
            presentDays = pr.presentDays;
            absentDays = pr.absentDays;
            daysInMonth = pr.daysInMonth;
            earnedBasic = pr.earnedBasic;
            earnedAllowances = pr.earnedAllowances;
            earnedGross = pr.earnedGross;
            deductions = pr.deductions;
            net = pr.net;
        } else if (typeof presentDays === "undefined" || typeof absentDays === "undefined" || typeof daysInMonth === "undefined") {
            if (p.month) {
                daysInMonth = new Date(parseInt(p.month.split('-')[0]), parseInt(p.month.split('-')[1]), 0).getDate();
            }
        }
        csv += `"${p.employeeId || ""}","${emp.name || p.employee || ""}","${p.month || ""}","${earnedBasic || p.basic || 0}","${earnedAllowances || p.allowances || 0}","${earnedGross || p.gross || 0}","${deductions || 0}","${net || 0}","${typeof presentDays !== "undefined" ? presentDays : ""}","${typeof absentDays !== "undefined" ? absentDays : ""}","${daysInMonth || ""}","${emp.department || p.empdept || ""}"\n`;
    });
    const blob = new Blob([csv], {type: "text/csv"});
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "payslips.csv";
    link.click();
};

renderTable();
}
// Holidays Module
if (panelKey === "holidays") {
let sortCol = null, sortAsc = true;

function renderTable(filter = "") {
let data = holidays.map((h, i) => ({ ...h, idx: i }));
if (filter) {
data = data.filter(h =>
(h.date || "").toLowerCase().includes(filter) ||
(h.name || "").toLowerCase().includes(filter) ||
(h.desc || "").toLowerCase().includes(filter)
);
}
if (sortCol) {
data.sort((a, b) => {
if (a[sortCol] < b[sortCol]) return sortAsc ? -1 : 1;
if (a[sortCol] > b[sortCol]) return sortAsc ? 1 : -1;
return 0;
});
}
const tbody = document.getElementById("holidayTableBody");
tbody.innerHTML = "";
data.forEach(h => {
const tr = document.createElement("tr");
tr.innerHTML = `
<td>${h.date || ""}</td>
<td>${h.name || ""}</td>
<td>${h.desc || ""}</td>
<td class="actions">
<button class="edit-btn" data-idx="${h.idx}">Edit</button>
<button class="delete-btn" data-idx="${h.idx}">Delete</button>
</td>
`;
tbody.appendChild(tr);
});
document.querySelectorAll(".edit-btn").forEach(btn => {
btn.onclick = function() {
let idx = this.dataset.idx;
let h = holidays[idx];
let tr = this.closest("tr");
tr.innerHTML = `
<td><input type="date" value="${h.date || ""}" id="editDate${idx}"></td>
<td><input value="${h.name || ""}" id="editName${idx}"></td>
<td><input value="${h.desc || ""}" id="editDesc${idx}"></td>
<td class="actions">
<button class="save-btn" id="saveEdit${idx}">Save</button>
<button class="cancel-btn" id="cancelEdit${idx}">Cancel</button>
</td>
`;
document.getElementById(`saveEdit${idx}`).onclick = function() {
holidays[idx] = {
date: document.getElementById(`editDate${idx}`).value,
name: document.getElementById(`editName${idx}`).value,
desc: document.getElementById(`editDesc${idx}`).value
};
showNotif("Holiday updated!");
renderTable(document.getElementById("holidaySearch").value.toLowerCase());
};
document.getElementById(`cancelEdit${idx}`).onclick = function() {
renderTable(document.getElementById("holidaySearch").value.toLowerCase());
};
};
});
document.querySelectorAll(".delete-btn").forEach(btn => {
btn.onclick = function() {
let idx = this.dataset.idx;
if (confirm("Delete this holiday?")) {
holidays.splice(idx, 1);
showNotif("Holiday deleted!");
renderTable(document.getElementById("holidaySearch").value.toLowerCase());
}
};
});
}

document.getElementById("addHolidayForm").onsubmit = function(e) {
e.preventDefault();
holidays.push({
date: document.getElementById("holidayDate").value,
name: document.getElementById("holidayName").value,
desc: document.getElementById("holidayDesc").value
});
showNotif("Holiday added!");
this.reset();
renderTable(document.getElementById("holidaySearch").value.toLowerCase());
};

document.getElementById("holidaySearch").oninput = function() {
renderTable(this.value.toLowerCase());
};

document.getElementById("holidayExport").onclick = function() {
let csv = "Date,Holiday Name,Description\n";
holidays.forEach(h => {
csv += `"${h.date || ""}","${h.name || ""}","${h.desc || ""}"\n`;
});
const blob = new Blob([csv], { type: "text/csv" });
const link = document.createElement("a");
link.href = URL.createObjectURL(blob);
link.download = "holidays.csv";
link.click();
};

document.querySelectorAll("th[data-col]").forEach(th => {
th.onclick = function() {
let col = this.getAttribute("data-col");
if (sortCol === col) sortAsc = !sortAsc;
else { sortCol = col; sortAsc = true; }
renderTable(document.getElementById("holidaySearch").value.toLowerCase());
};
});

renderTable();
}

// --------------------------------------------
// ADVANCED LOG REPORT MODULE
// --------------------------------------------
if (panelKey === "logreport") {

    // --- Initialize Logs ---
    if (!window.hrmsLogs) {
        window.hrmsLogs = JSON.parse(localStorage.getItem("hrms_logs") || "[]");

        // Create sample logs if empty
        if (window.hrmsLogs.length === 0) {
            window.hrmsLogs = [
                { timestamp: new Date().toISOString(), user: "admin", action: "Login", details: "Logged into HRMS" },
                { timestamp: new Date().toISOString(), user: "admin", action: "Viewed", details: "Opened Employee Database" }
            ];
        }
    }

    // --- Save Automatically ---
    function saveLogs() {
        localStorage.setItem("hrms_logs", JSON.stringify(window.hrmsLogs));
    }

    // --- Add Log Entry ---
    window.addLog = function (user, action, details) {
        window.hrmsLogs.push({
            timestamp: new Date().toISOString(),
            user,
            action,
            details
        });
        saveLogs();
        renderTable();
    };

    // Auto Example:
    addLog("System", "Module Load", "User opened Log Report module");

    // --- FILTER CONTROLS ---
    const searchInput = document.getElementById("logSearch");
    const userFilter = document.getElementById("logUserFilter");
    const dateFrom = document.getElementById("logDateFrom");
    const dateTo = document.getElementById("logDateTo");
    const tbody = document.getElementById("logTableBody");

    // Populate user dropdown
    const uniqueUsers = [...new Set(window.hrmsLogs.map(l => l.user))];
    userFilter.innerHTML = `<option value="">All Users</option>` +
        uniqueUsers.map(u => `<option>${u}</option>`).join("");

    // --- TABLE RENDER FUNCTION ---
    function renderTable() {
        let data = window.hrmsLogs.slice().reverse();

        let searchValue = searchInput.value.toLowerCase();

        data = data.filter(l =>
            (!userFilter.value || l.user === userFilter.value) &&
            (!dateFrom.value || new Date(l.timestamp) >= new Date(dateFrom.value)) &&
            (!dateTo.value || new Date(l.timestamp) <= new Date(dateTo.value + "T23:59:59")) &&
            (
                l.timestamp.toLowerCase().includes(searchValue) ||
                l.user.toLowerCase().includes(searchValue) ||
                l.action.toLowerCase().includes(searchValue) ||
                l.details.toLowerCase().includes(searchValue)
            )
        );

        tbody.innerHTML = "";

        data.forEach(log => {
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td>${log.timestamp.replace("T", " ").slice(0, 19)}</td>
                <td>${log.user}</td>
                <td>${log.action}</td>
                <td>${log.details}</td>
            `;
            tbody.appendChild(tr);
        });
    }

    searchInput.oninput = renderTable;
    userFilter.onchange = renderTable;
    dateFrom.onchange = renderTable;
    dateTo.onchange = renderTable;

    // --- EXPORT TO CSV ---
    document.getElementById("logExport").onclick = function () {
        let csv = "Date & Time,User,Action,Details\n";

        window.hrmsLogs.forEach(log => {
            csv += `"${log.timestamp.replace("T", " ").slice(0, 19)}","${log.user}","${log.action}","${log.details}"\n`;
        });

        const blob = new Blob([csv], { type: "text/csv" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = "HRMS_Log_Report.csv";
        link.click();
    };

    // --- EXPORT TO EXCEL ---
    document.getElementById("logExportXLS").onclick = function () {
        let excel = `
            <table border="1">
                <tr><th>Date & Time</th><th>User</th><th>Action</th><th>Details</th></tr>
                ${window.hrmsLogs.map(log =>
            `<tr>
                <td>${log.timestamp.replace("T", " ").slice(0, 19)}</td>
                <td>${log.user}</td>
                <td>${log.action}</td>
                <td>${log.details}</td>
            </tr>`
        ).join("")}
            </table>
        `;

        const blob = new Blob([excel], { type: "application/vnd.ms-excel" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = "HRMS_Log_Report.xls";
        link.click();
    };

    renderTable();
}

}

// Menu click handler
document.getElementById('menu').addEventListener('click', function(e) {
if (e.target.tagName === 'LI') {
document.querySelectorAll('.menu li').forEach(li => li.classList.remove('active'));
e.target.classList.add('active');
renderPanel(e.target.getAttribute('data-panel'));
}
});

// Initialize the application
loadAllData();
renderPanel("employee");

// Save all data before unload
window.addEventListener('beforeunload', saveAllData); 