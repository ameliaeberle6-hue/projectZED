// Keep settings and future bucket-list items together under the app's one storage key.
const STORAGE_KEY = "before-i-walk";
const DAY_IN_MILLISECONDS = 24 * 60 * 60 * 1000;
// NEW: Use the first day of school as the fixed start of the graduation pace timeline.
const SCHOOL_START_DATE = "2026-08-24";
const emptyData = {
    graduationDate: "",
    listStartedDate: SCHOOL_START_DATE,
    items: [],
    assignments: []
};

const graduationForm = document.querySelector("#graduation-form");
const graduationDateInput = document.querySelector("#graduation-date");
const paceMessage = document.querySelector("#pace-message");
const paceProgress = document.querySelector("#pace-progress");
const itemsCompletePercent = document.querySelector("#items-complete-percent");
const bucketListForm = document.querySelector("#bucket-list-form");
const itemTextInput = document.querySelector("#item-text");
const itemTagInput = document.querySelector("#item-tag");
const bucketList = document.querySelector("#bucket-list");
const listStatus = document.querySelector("#list-status");
const assignmentForm = document.querySelector("#assignment-form");
const assignmentNameInput = document.querySelector("#assignment-name");
const assignmentDueDateInput = document.querySelector("#assignment-due-date");
const assignmentList = document.querySelector("#assignment-list");
const assignmentStatus = document.querySelector("#assignment-status");
const countdownMessage = document.querySelector("#countdown");
const formMessage = document.querySelector("#form-message");

// A broken saved value starts a fresh record and gives the user an explicit notice.
function loadData() {
    let savedText;

    try {
        savedText = localStorage.getItem(STORAGE_KEY);
    } catch {
        formMessage.textContent = "Browser storage is unavailable. Your date cannot be saved.";
        return { ...emptyData };
    }

    if (savedText === null) {
        return { ...emptyData };
    }

    try {
        const savedData = JSON.parse(savedText);
        const savedAssignments = savedData !== null && savedData.assignments !== undefined
            ? savedData.assignments
            : [];

        if (
            savedData === null ||
            typeof savedData !== "object" ||
            typeof savedData.graduationDate !== "string" ||
            typeof savedData.listStartedDate !== "string" ||
            !Array.isArray(savedData.items) ||
            !savedData.items.every((item) =>
                item !== null &&
                typeof item === "object" &&
                typeof item.text === "string" &&
                ["with-friends", "free", "off-campus"].includes(item.tag) &&
                typeof item.done === "boolean"
            ) ||
            !Array.isArray(savedAssignments) ||
            !savedAssignments.every((assignment) =>
                assignment !== null &&
                typeof assignment === "object" &&
                typeof assignment.name === "string" &&
                isValidDateString(assignment.dueDate) &&
                typeof assignment.done === "boolean"
            ) ||
            (savedData.graduationDate !== "" && !isValidDateString(savedData.graduationDate)) ||
            (savedData.listStartedDate !== "" && !isValidDateString(savedData.listStartedDate))
        ) {
            throw new TypeError("Saved data has an unexpected shape.");
        }

        return {
            ...savedData,
            listStartedDate: SCHOOL_START_DATE,
            assignments: savedAssignments
        };
    } catch {
        formMessage.textContent = "Saved data could not be read. Add a date or list item to start a fresh record.";
        return { ...emptyData };
    }
}

let appData = loadData();

// NEW: Use local date parts for today so the countdown matches the user's calendar day.
function getLocalDateString(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

// NEW: Convert a date-only value to UTC days so daylight-saving changes do not shift the count.
function getDayNumber(dateString) {
    const [year, month, day] = dateString.split("-").map(Number);
    const date = new Date(0);
    date.setUTCHours(0, 0, 0, 0);
    date.setUTCFullYear(year, month - 1, day);
    return Math.floor(date.getTime() / DAY_IN_MILLISECONDS);
}

function isValidDateString(dateString) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
        return false;
    }

    const [year, month, day] = dateString.split("-").map(Number);
    const parsedDate = new Date(0);
    parsedDate.setUTCHours(0, 0, 0, 0);
    parsedDate.setUTCFullYear(year, month - 1, day);

    return (
        parsedDate.getUTCFullYear() === year &&
        parsedDate.getUTCMonth() === month - 1 &&
        parsedDate.getUTCDate() === day
    );
}

function renderCountdown() {
    if (!appData.graduationDate) {
        countdownMessage.textContent = "Set your graduation date to start the countdown.";
        return;
    }

    const daysLeft = getDayNumber(appData.graduationDate) - getDayNumber(getLocalDateString(new Date()));

    if (daysLeft < 0) {
        countdownMessage.textContent = "Congrats, you graduated!";
    } else if (daysLeft === 0) {
        countdownMessage.textContent = "Graduation day is today!";
    } else {
        countdownMessage.textContent = `${daysLeft} ${daysLeft === 1 ? "day" : "days"} left until graduation.`;
    }
}

// NEW: Compare completed items with the share of the graduation timeline that has passed.
function renderPace() {
    const totalBucketItems = appData.items.length;
    const completedBucketItems = appData.items.filter((item) => item.done).length;
    const progressPercent = totalBucketItems === 0
        ? 0
        : Math.round((completedBucketItems / totalBucketItems) * 100);
    // NEW: Count unfinished assignments with unfinished bucket-list items for the schedule estimate.
    const totalTasks = totalBucketItems + appData.assignments.length;
    const completedTasks = completedBucketItems +
        appData.assignments.filter((assignment) => assignment.done).length;
    const hasTimeline = isValidDateString(appData.graduationDate);

    let timelineDays = 0;
    let today = 0;
    let startDay = 0;
    let graduationDay = 0;

    if (hasTimeline) {
        today = getDayNumber(getLocalDateString(new Date()));
        startDay = getDayNumber(SCHOOL_START_DATE);
        graduationDay = getDayNumber(appData.graduationDate);
        timelineDays = graduationDay - startDay;
    }

    const daysLeft = hasTimeline ? Math.max(0, graduationDay - today) : 0;

    paceProgress.value = progressPercent;
    itemsCompletePercent.textContent = `${progressPercent}%`;

    if (totalTasks === 0) {
        paceMessage.textContent = "0 tasks done. Add bucket-list items or school assignments to see your pace.";
        return;
    }

    const taskCount = `${completedTasks} of ${totalTasks} tasks done.`;

    if (!hasTimeline) {
        paceMessage.textContent = `${progressPercent}% of your list is complete. Set your graduation date to compare it with time remaining.`;
        return;
    }

    const elapsedDays = today - startDay;
    const timelineProgress = timelineDays <= 0
        ? (today >= graduationDay ? 1 : 0)
        : Math.min(1, Math.max(0, elapsedDays / timelineDays));
    const expectedTasks = totalTasks * timelineProgress;
    const progressDifference = completedTasks - expectedTasks;
    if (progressDifference >= 1) {
        paceMessage.textContent = `${taskCount} Ahead by ${Math.floor(progressDifference)}.`;
        return;
    }

    if (progressDifference >= 0) {
        paceMessage.textContent = `${taskCount} You're on track!`;
        return;
    }

    const itemsBehind = Math.ceil(Math.abs(progressDifference));

    if (daysLeft === 0) {
        paceMessage.textContent = `${taskCount} Behind by ${itemsBehind}. Graduation day is here; finish your remaining tasks today.`;
        return;
    }

    paceMessage.textContent = `${taskCount} Behind by ${itemsBehind}.`;
}

function saveData(nextData) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(nextData));
    } catch {
        formMessage.textContent = "Browser storage is unavailable. Your changes cannot be saved.";
        return false;
    }

    appData = nextData;
    return true;
}

// NEW: Draw saved list items with text nodes so typed text is displayed safely as text.
function renderList() {
    bucketList.replaceChildren();

    if (appData.items.length === 0) {
        const emptyItem = document.createElement("li");
        emptyItem.textContent = "Your list is empty. Add something you want to do!";
        bucketList.append(emptyItem);
        return;
    }

    appData.items.forEach((item, index) => {
        const listItem = document.createElement("li");
        const checkbox = document.createElement("input");
        const itemLabel = document.createElement("label");
        const itemTag = document.createElement("span");
        const checkboxId = `bucket-done-${index}`;

        listItem.className = "bucket-list-item";
        checkbox.id = checkboxId;
        checkbox.type = "checkbox";
        checkbox.className = "bucket-checkbox";
        checkbox.checked = item.done;
        checkbox.dataset.itemIndex = String(index);
        itemLabel.htmlFor = checkboxId;
        itemLabel.className = `bucket-item-name${item.done ? " is-done" : ""}`;
        itemLabel.textContent = item.text;
        itemTag.className = "item-tag";
        itemTag.textContent = item.tag === "with-friends"
            ? "With friends"
            : item.tag === "off-campus"
                ? "Off campus"
                : "Free";

        listItem.append(checkbox, itemLabel, itemTag);
        bucketList.append(listItem);
    });
}

// NEW: Show assignments with labeled checkboxes and their due dates.
function renderAssignments() {
    assignmentList.replaceChildren();

    if (appData.assignments.length === 0) {
        const emptyItem = document.createElement("li");
        emptyItem.textContent = "No school assignments yet. Add one above.";
        assignmentList.append(emptyItem);
        return;
    }

    appData.assignments.forEach((assignment, index) => {
        const listItem = document.createElement("li");
        const checkbox = document.createElement("input");
        const nameLabel = document.createElement("label");
        const dueDate = document.createElement("p");
        const checkboxId = `assignment-done-${index}`;

        listItem.className = "assignment-item";
        checkbox.id = checkboxId;
        checkbox.type = "checkbox";
        checkbox.className = "assignment-checkbox";
        checkbox.checked = assignment.done;
        checkbox.dataset.assignmentIndex = String(index);
        nameLabel.htmlFor = checkboxId;
        nameLabel.className = `assignment-name${assignment.done ? " is-done" : ""}`;
        nameLabel.textContent = assignment.name;
        dueDate.className = "assignment-due-date";
        dueDate.textContent = `Due ${assignment.dueDate}`;

        listItem.append(checkbox, nameLabel, dueDate);
        assignmentList.append(listItem);
    });
}

// Restore the saved graduation date in the date picker.
if (isValidDateString(appData.graduationDate)) {
    graduationDateInput.value = appData.graduationDate;
}
renderCountdown();
renderList();
renderPace();
renderAssignments();

graduationForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const chosenDate = graduationDateInput.value;
    const today = getLocalDateString(new Date());

    if (!isValidDateString(chosenDate) || chosenDate < today) {
        formMessage.textContent = "Choose a valid graduation date that is today or later.";
        graduationDateInput.focus();
        return;
    }

    const nextData = {
        ...appData,
        graduationDate: chosenDate,
        listStartedDate: SCHOOL_START_DATE
    };

    if (saveData(nextData)) {
        formMessage.textContent = "";
        renderCountdown();
        renderPace();
    }
});

// NEW: Add an unfinished, tagged item and save it with the rest of the app data.
bucketListForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const text = itemTextInput.value.trim();
    const tag = itemTagInput.value;

    if (text === "") {
        formMessage.textContent = "Enter something you want to do before adding it.";
        itemTextInput.focus();
        return;
    }

    const newItem = { text, tag, done: false };
    const nextData = {
        ...appData,
        listStartedDate: SCHOOL_START_DATE,
        items: [...appData.items, newItem]
    };

    if (saveData(nextData)) {
        formMessage.textContent = "";
        itemTextInput.value = "";
        listStatus.textContent = `Added to your list: ${text}`;
        renderList();
        renderPace();
        itemTextInput.focus();
    }
});

// NEW: Update a bucket-list item's done state and recalculate the pace after each check.
bucketList.addEventListener("change", (event) => {
    if (!(event.target instanceof HTMLInputElement) || event.target.type !== "checkbox") {
        return;
    }

    const itemIndex = Number(event.target.dataset.itemIndex);

    if (!Number.isInteger(itemIndex) || itemIndex < 0 || itemIndex >= appData.items.length) {
        return;
    }

    const updatedItems = appData.items.map((item, index) =>
        index === itemIndex
            ? { ...item, done: event.target.checked }
            : item
    );
    const nextData = { ...appData, items: updatedItems };

    if (saveData(nextData)) {
        listStatus.textContent = event.target.checked
            ? `Completed: ${appData.items[itemIndex].text}.`
            : `Marked not done: ${appData.items[itemIndex].text}.`;
        renderList();
        renderPace();
    } else {
        event.target.checked = appData.items[itemIndex].done;
    }
});

// NEW: Save a school assignment with its due date and unfinished state.
assignmentForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const name = assignmentNameInput.value.trim();
    const dueDate = assignmentDueDateInput.value;

    if (name === "") {
        formMessage.textContent = "Enter an assignment name before adding it.";
        assignmentNameInput.focus();
        return;
    }

    if (!isValidDateString(dueDate)) {
        formMessage.textContent = "Choose a valid due date for the assignment.";
        assignmentDueDateInput.focus();
        return;
    }

    const nextData = {
        ...appData,
        assignments: [...appData.assignments, { name, dueDate, done: false }]
    };

    if (saveData(nextData)) {
        formMessage.textContent = "";
        assignmentNameInput.value = "";
        assignmentDueDateInput.value = "";
        assignmentStatus.textContent = `Added assignment: ${name}.`;
        renderAssignments();
        renderPace();
        assignmentNameInput.focus();
    }
});

// NEW: Handle all assignment checkboxes from the list in one event listener.
assignmentList.addEventListener("change", (event) => {
    if (!(event.target instanceof HTMLInputElement) || event.target.type !== "checkbox") {
        return;
    }

    const assignmentIndex = Number(event.target.dataset.assignmentIndex);

    if (
        !Number.isInteger(assignmentIndex) ||
        assignmentIndex < 0 ||
        assignmentIndex >= appData.assignments.length
    ) {
        return;
    }

    // NEW: Make a changed copy so a save failure leaves the current data untouched.
    const updatedAssignments = appData.assignments.map((assignment, index) =>
        index === assignmentIndex
            ? { ...assignment, done: event.target.checked }
            : assignment
    );
    const nextData = { ...appData, assignments: updatedAssignments };

    if (saveData(nextData)) {
        assignmentStatus.textContent = event.target.checked
            ? `Completed assignment: ${appData.assignments[assignmentIndex].name}.`
            : `Marked assignment not done: ${appData.assignments[assignmentIndex].name}.`;
        renderAssignments();
        renderPace();
    } else {
        event.target.checked = appData.assignments[assignmentIndex].done;
    }
});