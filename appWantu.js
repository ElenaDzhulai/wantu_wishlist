// TODO:
// 1. add "order" to events
// 2. render sorted by "order" events
// 3. generate "order" number by the largest "order" value


export const AppWantu = {
    events: JSON.parse(localStorage.getItem("wishEvents")) || {},
    currentEvent: null,
    eventDelete: null,

    init: function () {
        document.getElementById('addEvent').onclick = this.addEvent.bind(this);
        document.getElementById("newEventInput").addEventListener("keydown", (e) => {
            if (e.key === "Enter") {
                this.addEvent();
            }
        });

        document.getElementById("confirmDelete").onclick = this.deleteEvent.bind(this);
        document.getElementById("cancelDelete").onclick = this.closeDeleteModal;

        document.getElementById('addWish').onclick = this.addWish.bind(this);

        document.getElementById('savePDF').onclick = this.saveToPDF.bind(this);

        this.renderEvents();
        this.renderWishes();
    },
    saveToStorage: function () {
        localStorage.setItem("wishEvents", JSON.stringify(this.events));
    },
    renderEvents: function () {
        const list = document.getElementById("eventList");
        list.innerHTML = "";

        const eventKeys = Object.keys(this.events);
        for (let i = 0; i < eventKeys.length; i++) {
            const event = eventKeys[i];

            const liElement = document.createElement("li");
            const eventWithControls = document.createElement("div");
            eventWithControls.className = "eventWithControls";

            const eventForm = document.createElement("div");
            eventForm.className = "eventForm";
            eventForm.style.display = "none";

            const span = document.createElement("span");
            span.textContent = event;
            liElement.className = event === this.currentEvent ? "active" : "";
            eventWithControls.onclick = (e) => {
                if (e.target.classList.contains('eventWithControls') || e.target.tagName === 'SPAN') {
                    this.currentEvent = event;
                    this.renderEvents();
                    this.renderWishes();
                }
            };

            const editButton = this.createIconButton("edit", () => this.editEvent(i, event), "Edit");
            const deleteButton = this.createIconButton("delete", () => this.showDeleteModal(event), "Delete");

            const buttonWrapper = document.createElement("div");
            buttonWrapper.className = "itemButtons";

            buttonWrapper.appendChild(editButton);
            buttonWrapper.appendChild(deleteButton);

            eventWithControls.appendChild(span);
            eventWithControls.appendChild(buttonWrapper);
            liElement.appendChild(eventWithControls);
            liElement.appendChild(eventForm);
            list.appendChild(liElement);
        }
    },
    addEvent: function () {
        console.log(this)
        const input = document.getElementById("newEventInput");
        const name = input.value.trim();
        if (name && !this.events[name]) {
            this.events[name] = [];
            this.currentEvent = name;
            this.saveToStorage();
            this.renderEvents();
            this.renderWishes();
            input.value = "";
        } else {
            alert("Enter an event title");
        }
    },
    deleteEvent: function () {
        if (eventDelete && this.events[eventDelete]) {
            delete this.events[eventDelete];
            if (this.currentEvent === eventDelete) {
                this.currentEvent = null;
            }
            this.saveToStorage();
            this.renderEvents();
            this.renderWishes();
        }
        this.closeDeleteModal();
    },
    editEvent: function (index, event) {
        const eventForm = document.querySelectorAll(".eventForm")[index];
        const eventWithControls = eventForm.parentElement.querySelector(".eventWithControls");

        let inputElement = document.createElement("input");
        inputElement.placeholder = "Event name";
        inputElement.value = event;

        const saveButton = document.createElement("button");
        const iconSave = document.createElement("i");

        iconSave.className = "material-icons";
        iconSave.textContent = "check";

        saveButton.appendChild(iconSave);
        saveButton.onclick = (e) => {
            e.stopPropagation();
            const newEvent = saveButton.parentElement.querySelector("input").value;
            this.saveEvent(event, newEvent);
        };

        eventForm.appendChild(inputElement);
        eventForm.appendChild(saveButton);
        eventWithControls.style.display = "none";
        eventForm.style.display = "flex";
        inputElement.focus();
    },
    saveEvent: function (oldEvent, newEvent) {
        if (oldEvent === newEvent) {
            this.renderEvents();
            return;
        }

        if (this.events[newEvent]) {
            alert(`Name "${newEvent}" already in your events list.`)
            return;
        }

        const newEvents = {};
        for (const key of Object.keys(this.events)) {
            if (key === oldEvent) {
                newEvents[newEvent] = this.events[oldEvent]
            } else {
                newEvents[key] = this.events[key]
            }
        }

        this.events = newEvents;
        if (this.currentEvent === oldEvent) {
            this.currentEvent = newEvent;
        }
        this.saveToStorage();
        this.renderEvents();
        this.renderWishes();
    },
    showDeleteModal: function (eventName) {
        eventDelete = eventName;
        document.getElementById("confirmModal").classList.remove("hidden");
    },
    closeDeleteModal: function () {
        eventDelete = null;
        document.getElementById("confirmModal").classList.add("hidden");
    },
    addWish: function () {
        const title = document.getElementById("wishTitleInput").value.trim();
        const link = document.getElementById("wishLinkInput").value.trim();
        if (!title) return alert("Please, enter a wish title");

        this.events[this.currentEvent].push({ title, link, done: false });
        this.saveToStorage();
        this.renderWishes();

        document.getElementById("wishTitleInput").value = "";
        document.getElementById("wishLinkInput").value = "";
    },
    toggleWish: function (index) {
        this.events[this.currentEvent][index].done = !this.events[this.currentEvent][index].done;
        this.saveToStorage();
        this.renderWishes();
    },
    editWishForm: function (container, wish, index) {
        let inputTitle = document.createElement("input");
        inputTitle.placeholder = "Title";
        let inputLink = document.createElement("input");
        inputLink.placeholder = "Link";

        if (wish.title) {
            inputTitle.value = wish.title;
        }

        if (wish.link) {
            inputLink.value = wish.link;
        }

        const saveButton = document.createElement("button");
        saveButton.textContent = "Save";
        saveButton.onclick = () => this.saveWish(index);

        container.appendChild(inputTitle);
        container.appendChild(inputLink);
        container.appendChild(saveButton);
    },
    saveWish: function (index) {
        const list = document.getElementById("wishList");
        const li = list.querySelectorAll("li")[index];
        const inputs = li.querySelectorAll("input");
        const title = inputs[1].value;
        const link = inputs[2].value;
        const wish = this.events[this.currentEvent][index];
        wish.title = title;
        wish.link = link;
        this.saveToStorage();
        this.renderWishes();
    },
    editWish: function (index) {
        const list = document.getElementById("wishList");
        const li = list.querySelectorAll("li")[index];
        const wishLabel = li.querySelector(".wishLabel");
        const itemButtons = li.querySelector(".itemButtons");
        wishLabel.style.display = "none";
        itemButtons.style.display = "none";
        const wish = this.events[this.currentEvent][index];
        this.editWishForm(li, wish, index);
    },
    deleteWish: function (index) {
        this.events[this.currentEvent].splice(index, 1);
        this.saveToStorage();
        this.renderWishes();
    },
    renderWishes: function () {
        const title = document.getElementById("eventTitle");
        const list = document.getElementById("wishList");

        if (!this.currentEvent) {
            list.style.display = "none";
            title.textContent = "Select an event";
            document.querySelector(".wishes_controls").style.display = "none";
            document.querySelector(".savePDF").style.display = "none";
            return;
        }

        document.querySelector(".wishes_controls").style.display = "flex";
        document.querySelector(".savePDF").style.display = "flex";

        if (this.events[this.currentEvent].length) {
            list.style.display = "block";
        } else {
            list.style.display = "none";
        }

        title.textContent = this.currentEvent;
        list.innerHTML = "";

        this.events[this.currentEvent].forEach((wish, i) => {
            const li = document.createElement("li");

            const container = document.createElement("div");
            container.className = "wishLabel";

            const checkbox = document.createElement("input");
            checkbox.type = "checkbox";
            checkbox.checked = wish.done;
            checkbox.classList.add("wish_checkbox");
            checkbox.onchange = () => this.toggleWish(i);
            container.appendChild(checkbox);

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
                this.renderWishes();
            };
            container.appendChild(titleElement);

            const editButton = this.createIconButton("edit", () => this.editWish(i), "Edit");
            const deleteButton = this.createIconButton("delete", () => this.deleteWish(i), "Delete");

            container.appendChild(editButton);
            container.appendChild(deleteButton);

            const buttonWrapper = document.createElement("div");
            buttonWrapper.className = "itemButtons"

            buttonWrapper.appendChild(editButton);
            buttonWrapper.appendChild(deleteButton);

            li.appendChild(container);
            li.appendChild(buttonWrapper);
            list.appendChild(li);
        });
    },
    createIconButton(iconText, onclick, title = "") {
        const button = document.createElement("button");
        button.className = "icon-button"

        const icon = document.createElement("i");
        icon.className = "material-icons";
        icon.textContent = iconText;

        button.appendChild(icon);
        if (title) button.title = title;
        button.onclick = (e) => {
            e.stopImmediatePropagation();
            onclick(e);
        };
        return button;
    },
    saveToPDF: async function () {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        doc.setFontSize(14);
        doc.text(`My Wish List: ${this.currentEvent}`, 10, 10);

        let y = 20;
        if (!this.events[this.currentEvent] || this.events[this.currentEvent].length === 0) {
            alert("This event has no wishes to export.");
            return;
        }

        this.events[this.currentEvent].forEach((wish, index) => {
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

        doc.save(`${this.currentEvent}_wish_list.pdf`);
    }
}