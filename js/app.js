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
const paceLabel = document.querySelector("#pace-label");
const paceTaskCount = document.querySelector("#pace-task-count");
const paceDaysLeft = document.querySelector("#pace-days-left");
const paceRemaining = document.querySelector("#pace-remaining");
const bucketListForm = document.querySelector("#bucket-list-form");
const itemTextInput = document.querySelector("#item-text");
const itemTagInput = document.querySelector("#item-tag");
const bucketList = document.querySelector("#bucket-list");
const listStatus = document.querySelector("#list-status");
const countdownMessage = document.querySelector("#countdown");
const countdownDays = document.querySelector("#countdown-days");
const countdownHours = document.querySelector("#countdown-hours");
const countdownMinutes = document.querySelector("#countdown-minutes");
const countdownSeconds = document.querySelector("#countdown-seconds");
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
        countdownDays.textContent = "00";
        countdownHours.textContent = "00";
        countdownMinutes.textContent = "00";
        countdownSeconds.textContent = "00";
        return;
    }

    const [year, month, day] = appData.graduationDate.split("-").map(Number);
    const graduationDayEnd = new Date(year, month - 1, day + 1);
    const secondsLeft = Math.max(0, Math.floor((graduationDayEnd.getTime() - Date.now()) / 1000));
    const daysLeft = Math.floor(secondsLeft / (24 * 60 * 60));
    const hoursLeft = Math.floor((secondsLeft % (24 * 60 * 60)) / (60 * 60));
    const minutesLeft = Math.floor((secondsLeft % (60 * 60)) / 60);
    const secondsRemaining = secondsLeft % 60;
    const today = getLocalDateString(new Date());

    countdownDays.textContent = String(daysLeft).padStart(2, "0");
    countdownHours.textContent = String(hoursLeft).padStart(2, "0");
    countdownMinutes.textContent = String(minutesLeft).padStart(2, "0");
    countdownSeconds.textContent = String(secondsRemaining).padStart(2, "0");

    if (today > appData.graduationDate) {
        countdownMessage.textContent = "Congrats, you graduated!";
    } else if (today === appData.graduationDate) {
        countdownMessage.textContent = "It's graduation day!";
    } else {
        countdownMessage.textContent = "Time left until graduation day:";
    }
}

// NEW: Compare completed items with the share of the graduation timeline that has passed.
function renderPace() {
    const totalBucketItems = appData.items.length;
    const completedBucketItems = appData.items.filter((item) => item.done).length;
    const totalTasks = totalBucketItems;
    const completedTasks = completedBucketItems;
    const remainingTasks = totalTasks - completedTasks;
    const progressPercent = totalTasks === 0
        ? 0
        : Math.round((completedTasks / totalTasks) * 100);
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

    const rawDaysLeft = hasTimeline ? graduationDay - today : null;
    const daysLeft = rawDaysLeft === null ? null : Math.max(0, rawDaysLeft);

    paceProgress.setAttribute("aria-valuenow", String(progressPercent));
    paceProgress.style.setProperty("--pace-progress", `${progressPercent}%`);
    itemsCompletePercent.textContent = `${progressPercent}%`;
    paceTaskCount.textContent = `${completedTasks}/${totalTasks}`;
    paceDaysLeft.textContent = daysLeft === null
        ? "—"
        : String(daysLeft);
    paceRemaining.textContent = String(remainingTasks);

    if (totalTasks === 0) {
        paceLabel.textContent = hasTimeline ? "Ready when you are" : "Let's get started";
        paceMessage.textContent = "Add bucket-list ideas to see how your senior year is shaping up.";
        return;
    }

    if (!hasTimeline) {
        paceLabel.textContent = "Set your date";
        paceMessage.textContent = "Your tasks are on the board. Set your graduation date to see how your progress lines up with the time left.";
        return;
    }

    const elapsedDays = today - startDay;
    const timelineProgress = timelineDays <= 0
        ? (today >= graduationDay ? 1 : 0)
        : Math.min(1, Math.max(0, elapsedDays / timelineDays));
    const expectedTasks = totalTasks * timelineProgress;
    const progressDifference = completedTasks - expectedTasks;

    if (rawDaysLeft < 0) {
        paceLabel.textContent = "Graduation passed";
        paceMessage.textContent = remainingTasks === 0
            ? "You checked everything off. Congratulations, graduate!"
            : `Graduation day has passed with ${remainingTasks} ${remainingTasks === 1 ? "task" : "tasks"} left on your list.`;
        return;
    }

    if (rawDaysLeft === 0) {
        paceLabel.textContent = remainingTasks === 0 ? "All done" : "Graduation day";
        paceMessage.textContent = remainingTasks === 0
            ? "You checked everything off. Congratulations!"
            : `Graduation day is here, with ${remainingTasks} ${remainingTasks === 1 ? "task" : "tasks"} left.`;
        return;
    }

    if (progressDifference >= 1) {
        const aheadBy = Math.floor(progressDifference);
        paceLabel.textContent = "Ahead of pace";
        paceMessage.textContent = `You're ahead of your steady pace by ${aheadBy} ${aheadBy === 1 ? "task" : "tasks"}. Keep it up!`;
        return;
    }

    if (progressDifference >= 0) {
        paceLabel.textContent = "On track";
        paceMessage.textContent = "You're right on track with a steady pace toward graduation.";
        return;
    }

    const itemsBehind = Math.ceil(Math.abs(progressDifference));
    paceLabel.textContent = "A little behind";
    paceMessage.textContent = `You're about ${itemsBehind} ${itemsBehind === 1 ? "task" : "tasks"} behind a steady pace. There's still time to catch up.`;
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

// Restore the saved graduation date in the date picker.
if (isValidDateString(appData.graduationDate)) {
    graduationDateInput.value = appData.graduationDate;
}
renderCountdown();
renderList();
renderPace();
setInterval(renderCountdown, 1000);

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
