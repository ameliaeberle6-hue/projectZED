const STORAGE_KEY = "before-i-walk-applications";
const STATUSES = ["waiting", "interviewing", "accepted", "denied"];
const STATUS_LABELS = {
    waiting: "Waiting to hear",
    interviewing: "Interviewing",
    accepted: "Accepted",
    denied: "Denied"
};

const applicationForm = document.querySelector("#application-form");
const companyInput = document.querySelector("#company-name");
const roleInput = document.querySelector("#job-title");
const appliedDateInput = document.querySelector("#application-date");
const statusInput = document.querySelector("#application-status");
const followUpDateInput = document.querySelector("#follow-up-date");
const notesInput = document.querySelector("#application-notes");
const formMessage = document.querySelector("#application-form-message");
const listMessage = document.querySelector("#application-list-message");
const applicationList = document.querySelector("#application-list");
const applicationSearch = document.querySelector("#application-search");
const applicationFilter = document.querySelector("#application-filter");
const totalCount = document.querySelector("#total-count");
const waitingCount = document.querySelector("#waiting-count");
const interviewCount = document.querySelector("#interview-count");
const acceptedCount = document.querySelector("#accepted-count");
const deniedCount = document.querySelector("#denied-count");

function isValidDateString(value) {
    if (value === "") {
        return true;
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        return false;
    }

    const [year, month, day] = value.split("-").map(Number);
    const date = new Date(0);
    date.setUTCHours(0, 0, 0, 0);
    date.setUTCFullYear(year, month - 1, day);

    return date.getUTCFullYear() === year &&
        date.getUTCMonth() === month - 1 &&
        date.getUTCDate() === day;
}

function isApplication(value) {
    return value !== null &&
        typeof value === "object" &&
        typeof value.company === "string" &&
        typeof value.role === "string" &&
        isValidDateString(value.appliedDate) &&
        STATUSES.includes(value.status) &&
        typeof value.followUpDate === "string" &&
        isValidDateString(value.followUpDate) &&
        typeof value.notes === "string";
}

function loadApplications() {
    let savedText;
    try {
        savedText = localStorage.getItem(STORAGE_KEY);
    } catch {
        formMessage.textContent = "Browser storage is unavailable. Applications cannot be loaded or saved.";
        return [];
    }

    if (savedText === null) {
        return [];
    }

    try {
        const savedApplications = JSON.parse(savedText);
        if (!Array.isArray(savedApplications) || !savedApplications.every(isApplication)) {
            throw new TypeError("Saved applications have an unexpected shape.");
        }
        return savedApplications;
    } catch {
        formMessage.textContent = "Saved applications could not be read. Your existing data was left unchanged.";
        return [];
    }
}

let applications = loadApplications();

function saveApplications(nextApplications) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(nextApplications));
    } catch {
        formMessage.textContent = "Browser storage is unavailable. Your changes could not be saved.";
        return false;
    }

    applications = nextApplications;
    formMessage.textContent = "";
    return true;
}

function localDateString(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

function formatDate(dateString) {
    if (!dateString) {
        return "";
    }

    const [year, month, day] = dateString.split("-").map(Number);
    return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" })
        .format(new Date(year, month - 1, day));
}

function renderSummary() {
    totalCount.textContent = String(applications.length);
    waitingCount.textContent = String(applications.filter((application) => application.status === "waiting").length);
    interviewCount.textContent = String(applications.filter((application) => application.status === "interviewing").length);
    acceptedCount.textContent = String(applications.filter((application) => application.status === "accepted").length);
    deniedCount.textContent = String(applications.filter((application) => application.status === "denied").length);
}

function renderApplications() {
    const searchText = applicationSearch.value.trim().toLocaleLowerCase();
    const filterStatus = applicationFilter.value;
    const visibleApplications = applications
        .map((application, index) => ({ application, index }))
        .filter(({ application }) =>
            (filterStatus === "all" || application.status === filterStatus) &&
            `${application.company} ${application.role}`.toLocaleLowerCase().includes(searchText)
        )
        .sort((first, second) => second.index - first.index);

    applicationList.replaceChildren();

    if (visibleApplications.length === 0) {
        const emptyItem = document.createElement("li");
        emptyItem.className = "application-empty";
        emptyItem.textContent = applications.length === 0
            ? "No applications yet. Add your first one above and cheer yourself on!"
            : "No applications match this search. Try another filter or search term.";
        applicationList.append(emptyItem);
        return;
    }

    const today = localDateString(new Date());
    visibleApplications.forEach(({ application, index }) => {
        const item = document.createElement("li");
        const header = document.createElement("div");
        const titleGroup = document.createElement("div");
        const title = document.createElement("h3");
        const company = document.createElement("p");
        const status = document.createElement("span");
        const applied = document.createElement("p");
        const actions = document.createElement("div");
        const statusLabel = document.createElement("label");
        const statusSelect = document.createElement("select");
        const deleteButton = document.createElement("button");

        item.className = "application-item";
        item.dataset.applicationIndex = String(index);
        header.className = "application-item-header";
        title.textContent = application.role;
        company.className = "application-company";
        company.textContent = application.company;
        status.className = `application-status status-${application.status}`;
        status.textContent = STATUS_LABELS[application.status];
        titleGroup.append(title, company);
        header.append(titleGroup, status);
        applied.className = "application-meta";
        applied.textContent = `Applied ${formatDate(application.appliedDate)}`;
        item.append(header, applied);

        if (application.followUpDate) {
            const followUp = document.createElement("p");
            const isPending = application.status === "waiting";
            const isPastDue = isPending && application.followUpDate < today;
            const isDueToday = isPending && application.followUpDate === today;
            followUp.className = `application-meta${isPastDue || isDueToday ? " application-reminder" : ""}`;
            followUp.textContent = isPastDue
                ? `Follow-up overdue: ${formatDate(application.followUpDate)}`
                : isDueToday
                    ? `Follow up today: ${formatDate(application.followUpDate)}`
                    : `Follow up: ${formatDate(application.followUpDate)}`;
            item.append(followUp);
        }

        if (application.notes) {
            const notes = document.createElement("p");
            notes.className = "application-notes";
            notes.textContent = application.notes;
            item.append(notes);
        }

        actions.className = "application-item-actions";
        statusLabel.htmlFor = `application-status-${index}`;
        statusLabel.textContent = "Update status";
        statusSelect.id = `application-status-${index}`;
        statusSelect.dataset.applicationAction = "status";
        STATUSES.forEach((statusValue) => {
            const option = document.createElement("option");
            option.value = statusValue;
            option.textContent = STATUS_LABELS[statusValue];
            option.selected = statusValue === application.status;
            statusSelect.append(option);
        });
        statusLabel.append(statusSelect);
        deleteButton.type = "button";
        deleteButton.dataset.applicationAction = "delete";
        deleteButton.textContent = "Remove";
        actions.append(statusLabel, deleteButton);
        item.append(actions);
        applicationList.append(item);
    });
}

appliedDateInput.value = localDateString(new Date());
renderSummary();
renderApplications();

applicationForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const company = companyInput.value.trim();
    const role = roleInput.value.trim();
    const appliedDate = appliedDateInput.value;
    const status = statusInput.value;
    const followUpDate = followUpDateInput.value;
    const notes = notesInput.value.trim();

    if (!company || !role) {
        formMessage.textContent = "Add both a company and a job title.";
        (!company ? companyInput : roleInput).focus();
        return;
    }

    if (!isValidDateString(appliedDate) || !isValidDateString(followUpDate) || !STATUSES.includes(status)) {
        formMessage.textContent = "Choose valid application and follow-up dates.";
        return;
    }

    const nextApplications = [...applications, {
        company,
        role,
        appliedDate,
        status,
        followUpDate,
        notes
    }];

    if (saveApplications(nextApplications)) {
        applicationForm.reset();
        appliedDateInput.value = localDateString(new Date());
        applicationSearch.value = "";
        applicationFilter.value = "all";
        listMessage.textContent = `Added ${role} at ${company} to your job hunt.`;
        renderSummary();
        renderApplications();
        companyInput.focus();
    }
});

applicationSearch.addEventListener("input", renderApplications);
applicationFilter.addEventListener("change", renderApplications);

applicationList.addEventListener("change", (event) => {
    if (!(event.target instanceof HTMLSelectElement) ||
        event.target.dataset.applicationAction !== "status") {
        return;
    }

    const item = event.target.closest("[data-application-index]");
    const index = Number(item?.dataset.applicationIndex);
    const nextStatus = event.target.value;
    if (!Number.isInteger(index) || index < 0 || index >= applications.length ||
        !STATUSES.includes(nextStatus)) {
        return;
    }

    const nextApplications = applications.map((application, currentIndex) =>
        currentIndex === index ? { ...application, status: nextStatus } : application
    );
    if (saveApplications(nextApplications)) {
        listMessage.textContent = `${applications[index].role} is now ${STATUS_LABELS[nextStatus]}.`;
        renderSummary();
        renderApplications();
    } else {
        event.target.value = applications[index].status;
    }
});

applicationList.addEventListener("click", (event) => {
    if (!(event.target instanceof HTMLButtonElement) ||
        event.target.dataset.applicationAction !== "delete") {
        return;
    }

    const item = event.target.closest("[data-application-index]");
    const index = Number(item?.dataset.applicationIndex);
    if (!Number.isInteger(index) || index < 0 || index >= applications.length) {
        return;
    }

    const removedRole = applications[index].role;
    const nextApplications = applications.filter((_, currentIndex) => currentIndex !== index);
    if (saveApplications(nextApplications)) {
        listMessage.textContent = `Removed ${removedRole} from your job hunt.`;
        renderSummary();
        renderApplications();
    }
});
