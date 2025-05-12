let events = new Map(
    Object.entries(JSON.parse(localStorage.getItem("wishEvents") || "{}"))
);
let currentEvent = null;

function saveToStorage() {
    localStorage.setItem("wishEvents", JSON.stringify(Object.fromEntries(events)));
}

function renderEvents() {
    const list = document.getElementById("eventList");
    list.innerHTML = "";

    let i = 0;
    for (const [event] of events) {
        console.log(event);
        const liElement = document.createElement("li");
        const eventWithControls = document.createElement("div");
        eventWithControls.className = "eventWithControls";

        const eventForm = document.createElement("div");
        eventForm.className = "eventForm";
        eventForm.style.display = "none";

        const span = document.createElement("span");
        span.textContent = event;
        liElement.className = event === currentEvent ? "active" : "";
        eventWithControls.onclick = (e) => {
            if (e.target.classList.contains('eventWithControls') || e.target.tagName === 'SPAN') {
                currentEvent = event;
                renderEvents();
                renderWishes();
            }
        };

        const editButton = document.createElement("button");
        editButton.textContent = "Edit";
        editButton.onclick = (e) => {
            e.stopPropagation();
            editEvent(event);
        };

        const deleteButton = document.createElement("button");
        deleteButton.textContent = "Delete";
        deleteButton.onclick = (e) => {
            e.stopPropagation();
            showDeleteModal(event);
        };

        eventWithControls.appendChild(span);
        eventWithControls.appendChild(editButton);
        eventWithControls.appendChild(deleteButton);
        liElement.appendChild(eventWithControls);
        liElement.appendChild(eventForm);
        list.appendChild(liElement);
        i++;
    }
}

function addEvent() {
    const input = document.getElementById("newEventInput");
    const name = input.value.trim();
    if (name && !events.has(name)) {
        events.set(name, []);
        currentEvent = name;
        saveToStorage();
        renderEvents();
        renderWishes();
        input.value = "";
    } else {
        alert("Enter an event title");
    }
}

function editEvent(event) {
    let index = 0;
    for (const key of events.keys()) {
        if (key === event) break;
        index++;
    }
    const eventForm = document.querySelectorAll(".eventForm")[index];
    const eventWithControls = eventForm.parentElement.querySelector(".eventWithControls");

    let inputElement = document.createElement("input");
    inputElement.placeholder = "Event name";
    inputElement.value = event;

    const saveButton = document.createElement("button");
    saveButton.textContent = "Save";
    saveButton.onclick = (e) => {
        e.stopPropagation();
        const newEvent = saveButton.parentElement.querySelector("input").value;
        saveEvent(event, newEvent);
    };

    eventForm.appendChild(inputElement);
    eventForm.appendChild(saveButton);
    eventWithControls.style.display = "none";
    eventForm.style.display = "flex";
    inputElement.focus();
}

function saveEvent(oldEvent, newEvent) {
    if (events.has(newEvent)) {
        alert(`Name "${newEvent}" already in your events list.`);
        return;
    }

    const newEvents = new Map();
    for (const [key, value] of events) {
        newEvents.set(key === oldEvent ? newEvent : key, key === oldEvent ? value : value);
    }

    events = newEvents;
    if (currentEvent === oldEvent) currentEvent = newEvent;
    saveToStorage();
    renderEvents();
    renderWishes();
}

let eventDelete = null;

function showDeleteModal(eventName) {
    eventDelete = eventName;
    document.getElementById("confirmModal").classList.remove("hidden");
}

document.getElementById("confirmDelete").onclick = function () {
    if (eventDelete && events.has(eventDelete)) {
        events.delete(eventDelete);
        if (currentEvent === eventDelete) currentEvent = null;
        saveToStorage();
        renderEvents();
        renderWishes();
    }
    closeDeleteModal();
};

document.getElementById("cancelDelete").onclick = closeDeleteModal;

function closeDeleteModal() {
    eventDelete = null;
    document.getElementById("confirmModal").classList.add("hidden");
}

function addWish() {
    const title = document.getElementById("wishTitleInput").value.trim();
    const link = document.getElementById("wishLinkInput").value.trim();
    if (!title) return alert("Please, enter a wish title");

    events.get(currentEvent).push({ title, link, done: false });
    saveToStorage();
    renderWishes();

    document.getElementById("wishTitleInput").value = "";
    document.getElementById("wishLinkInput").value = "";
}

function toggleWish(index) {
    events.get(currentEvent)[index].done = !events.get(currentEvent)[index].done;
    saveToStorage();
    renderWishes();
}

function editWishForm(container, wish, index) {
    let inputTitle = document.createElement("input");
    inputTitle.placeholder = "Title";
    let inputLink = document.createElement("input");
    inputLink.placeholder = "Link";

    if (wish.title) inputTitle.value = wish.title;
    if (wish.link) inputLink.value = wish.link;

    const saveButton = document.createElement("button");
    saveButton.textContent = "Save";
    saveButton.onclick = () => saveWish(index);

    container.appendChild(inputTitle);
    container.appendChild(inputLink);
    container.appendChild(saveButton);
}

function saveWish(index) {
    const list = document.getElementById("wishList");
    const li = list.querySelectorAll("li")[index];
    const inputs = li.querySelectorAll("input");
    const title = inputs[1].value;
    const link = inputs[2].value;
    const wish = events.get(currentEvent)[index];
    wish.title = title;
    wish.link = link;
    saveToStorage();
    renderWishes();
}

function editWish(index) {
    const list = document.getElementById("wishList");
    const li = list.querySelectorAll("li")[index];
    const span = li.querySelector("span");
    span.style.display = "none";
    const wish = events.get(currentEvent)[index];
    editWishForm(li, wish, index);
}

function deleteWish(index) {
    events.get(currentEvent).splice(index, 1);
    saveToStorage();
    renderWishes();
}

function renderWishes() {
    const title = document.getElementById("eventTitle");
    const list = document.getElementById("wishList");

    if (!currentEvent) {
        list.style.display = "none";
        title.textContent = "Select an event";
        document.querySelector(".wishes_controls").style.display = "none";
        document.querySelector(".savePDF").style.display = "none";
        return;
    }

    document.querySelector(".wishes_controls").style.display = "block";
    document.querySelector(".savePDF").style.display = "block";

    list.style.display = "block";
    title.textContent = currentEvent;
    list.innerHTML = "";

    events.get(currentEvent).forEach((wish, i) => {
        const li = document.createElement("li");

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.checked = wish.done;
        checkbox.classList.add("wish_checkbox");
        checkbox.onchange = () => toggleWish(i);
        li.appendChild(checkbox);

        const container = document.createElement("span");

        const titleElement = document.createElement(wish.link ? "a" : "span");
        titleElement.textContent = wish.title;
        if (wish.link) {
            titleElement.href = wish.link;
            titleElement.target = "_blank";
            titleElement.title = wish.link;
        }
        if (wish.done) titleElement.classList.add("done");

        titleElement.onclick = () => {
            wish.editTitle = true;
            renderWishes();
        };
        container.appendChild(titleElement);

        const editButton = document.createElement("button");
        editButton.textContent = "Edit";
        editButton.onclick = () => editWish(i);
        container.appendChild(editButton);

        const deleteButton = document.createElement("button");
        deleteButton.textContent = "Delete";
        deleteButton.onclick = () => deleteWish(i);
        container.appendChild(deleteButton);

        li.appendChild(container);
        list.appendChild(li);
    });
}

renderEvents();
renderWishes();

async function saveToPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    doc.setFontSize(14);
    doc.text(`My Wish List: ${currentEvent}`, 10, 10);

    let y = 20;
    const wishes = events.get(currentEvent);
    if (!wishes || wishes.length === 0) {
        alert("This event has no wishes to export.");
        return;
    }

    wishes.forEach((wish, index) => {
        let text = `${index + 1}. ${wish.title}`;
        if (wish.link) text += ` (${wish.link})`;

        if (wish.done) {
            const lineStartX = 10;
            const lineStartY = y - 1;
            const lineEndX = doc.getTextWidth(text) + 10;

            doc.setLineWidth(0.5);
            doc.line(lineStartX, lineStartY, lineEndX, lineStartY);
        }

        doc.text(text, 10, y);
        y += 10;
    });

    doc.save(`${currentEvent}_wish_list.pdf`);
}
