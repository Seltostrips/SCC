✅ Primary Objective of Your App

To record and lock agreement on book vs physical count before scanning is initiated (which is done separately in Univair). This ensures:

    No client backtracking later.

    No staff mistakes left unchecked.

    A timestamped approval trail for every count variation.

🧩 Revised Functional Flow
🧍‍♀️ Audit Staff (e.g. Bhargavi)

    Login

    Enter Bin/Rack ID

    Input Book Quantity (from system)

    Input Physical Count (quick visual count)

    Submit Count

    System Logic:

    If Book = Physical Count → ✅ Auto-approved → Staff proceeds to Univair for scanning

    If Book ≠ Physical Count → 🚩 Query sent to Client

👨‍💼 Client

    Receives Query (with discrepancy details)

    Reviews On-Site Stock

    Chooses:

        ✅ “Agree with Actual” → Lock agreement → Staff proceeds to Univair

        ❌ “Disagree” → Sends back → Staff asked to recount

👩‍💼 Admin (You)

    Dashboard View:

        Total bins processed

        Discrepancies raised

        Client responses

        Staff productivity

        Time taken from start → approval → scanning

    Audit Log (by bin):

        Book qty

        Actual qty

        Staff input timestamp

        Client approval/rejection timestamp

        Status (approved, pending, resent)

🛠️ Technical Implementation (Updated)
Feature	Notes
Role-based Login	Admin, Staff, Client
Bin Entry Form	Rack ID, Book Qty, Actual Qty, Notes (optional)
Approval Workflow	Auto if match, else routed to client
Notifications	Email/WhatsApp or in-app to Client for mismatch
Timestamps	Every action (entry, submission, approval)
Dashboard	Real-time summary per warehouse/location
Reporting	Export audit logs to Excel/PDF
Hosting	Firebase / Vercel / AWS
