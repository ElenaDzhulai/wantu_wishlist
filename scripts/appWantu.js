export const AppWantu = {
  events: [],
  wishes: [],
  currentEvent: null,
  eventDelete: null,
  dbClient: null,

  init: async function (dbClient) {
    this.dbClient = dbClient;

    // TODO: process errors
    const { data, error } = await this.dbClient.from("events").select();
    this.events = data;

    document.getElementById("addEvent").onclick = this.addEvent.bind(this);
    document
      .getElementById("newEventInput")
      .addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          this.addEvent();
        }
      });

    document.getElementById("confirmDelete").onclick =
      this.deleteEvent.bind(this);
    document.getElementById("cancelDelete").onclick = this.closeDeleteModal;

    document.getElementById("addWish").onclick = this.addWish.bind(this);

    document.getElementById("savePDF").onclick = this.saveToPDF.bind(this);

    this.renderEvents();
    this.renderWishes();
  },
  async saveEventToDB(event) {
    const { error } = await this.dbClient
      .from("events")
      .update({ title: event.title })
      .eq("id", event.id);

    if (error) {
      console.error("[saveEventToDB] ", error);
    } else {
      this.events.find((ev) => ev.id === event.id).title = event.title;
    }
  },
  // NOTE: deprecated
  saveToStorage: function () {
    localStorage.setItem("wishEvents", JSON.stringify(this.events));
  },
  renderEvents: function () {
    const list = document.getElementById("eventList");
    list.innerHTML = "";

    const sortedEvents = this.events.sort((a, b) => a.order - b.order);
    for (let event of sortedEvents) {
      const liElement = document.createElement("li");
      const eventWithControls = document.createElement("div");
      eventWithControls.className = "eventWithControls";

      const eventForm = document.createElement("div");
      eventForm.className = "eventForm";
      eventForm.style.display = "none";

      const span = document.createElement("span");
      span.textContent = event.title;
      liElement.className = event.id === this.currentEvent ? "active" : "";
      liElement.setAttribute("data-eventid", event.id);
      liElement.setAttribute("data-eventid", event.id);
      eventWithControls.onclick = (e) => {
        if (
          e.target.classList.contains("eventWithControls") ||
          e.target.tagName === "SPAN"
        ) {
          this.currentEvent = event.id;
          this.renderEvents();
          this.renderWishes();
        }
      };

      const editButton = this.createIconButton(
        "edit",
        () => this.editEvent(event),
        "Edit",
      );
      const deleteButton = this.createIconButton(
        "delete",
        () => this.showDeleteModal(event),
        "Delete",
      );

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
  addEvent: async function () {
    const input = document.getElementById("newEventInput");
    const eventTitle = input.value.trim();
    if (
      eventTitle &&
      !this.events.some((event) => event.title === eventTitle)
    ) {
      const { data, error } = await this.dbClient
        .from("events")
        .insert({ title: eventTitle })
        .select();

      if (error) {
        console.error("[addEvent] ", error);
      } else {
        const createdEvent = data[0];
        this.currentEvent = createdEvent.id;
        this.events.push(createdEvent);
        this.renderEvents();
        this.renderWishes();
        input.value = "";
      }
    } else {
      if (!eventTitle) {
        alert("Enter an event title");
      } else {
        alert(`Name "${eventTitle}" already in your events list.`);
      }
    }
  },
  deleteEvent: async function () {
    const eventIndex = this.events.findIndex((e) => e.id === this.eventDelete);
    if (this.eventDelete && eventIndex > 0) {
      // delete from DB
      const response = await this.dbClient
        .from("events")
        .delete()
        .eq("id", this.eventDelete);

      if (response.error) {
        console.error("[deleteEvent] ", response.error);
      } else {
        if (this.currentEvent === this.eventDelete) {
          this.currentEvent = null;
        }
        // delete from local db
        this.events.splice(eventIndex, 1);
        this.renderEvents();
        this.renderWishes();
      }
      this.closeDeleteModal();
    }
  },
  editEvent: function (event) {
    const eventContainer = document.querySelector(
      `[data-eventid="${event.id}"]`,
    );
    const eventForm = eventContainer.querySelector(".eventForm");
    const eventWithControls =
      eventForm.parentElement.querySelector(".eventWithControls");

    let inputElement = document.createElement("input");
    inputElement.placeholder = "Event name";
    inputElement.value = event.title;

    const saveButton = document.createElement("button");
    const iconSave = document.createElement("i");

    iconSave.className = "material-icons";
    iconSave.textContent = "check";

    saveButton.appendChild(iconSave);
    saveButton.onclick = (e) => {
      e.stopPropagation();
      const newEventTitle =
        saveButton.parentElement.querySelector("input").value;
      const newEvent = { ...event, title: newEventTitle };
      this.saveEvent(event, newEvent);
    };

    eventForm.appendChild(inputElement);
    eventForm.appendChild(saveButton);
    eventWithControls.style.display = "none";
    eventForm.style.display = "flex";
    inputElement.focus();
  },
  saveEvent: async function (oldEvent, newEvent) {
    if (oldEvent.title === newEvent.title) {
      this.renderEvents();
      return;
    }

    // check if event with the same name already exists
    if (this.events.some((event) => event.title === newEvent.title)) {
      alert(`Name "${newEvent.title}" already in your events list.`);
      return;
    }

    await this.saveEventToDB(newEvent);
    this.renderEvents();
    this.renderWishes();
  },
  showDeleteModal: function (event) {
    this.eventDelete = event.id;
    document.getElementById("confirmModal").classList.remove("hidden");
  },
  closeDeleteModal: function () {
    this.eventDelete = null;
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
  toggleWish: async function (wishId) {
    const wish = this.wishes.find((w) => w.id === wishId);
    wish.done = !wish.done;

    const { error } = await this.dbClient
      .from("wishes")
      .update({ done: wish.done })
      .eq("id", wishId);

    if (error) {
      console.error(`[toggleWish] ${error}`);
    } else {
      this.renderWishes();
    }
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
  renderWishes: async function () {
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

    const { data, error } = await this.dbClient
      .from("wishes")
      .select("*")
      .eq("event_id", this.currentEvent);

    if (error) {
      console.error("[renderWishes] ", error);
    }

    this.wishes = data;

    if (this.wishes.length) {
      list.style.display = "block";
    } else {
      list.style.display = "none";
    }

    title.textContent = this.events.filter(
      (event) => event.id === this.currentEvent,
    )[0].title;
    list.innerHTML = "";

    this.wishes.forEach((wish) => {
      const li = document.createElement("li");
      li.setAttribute("data-wishid", wish.id);

      const container = document.createElement("div");
      container.className = "wishLabel";

      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.checked = wish.done;
      checkbox.classList.add("wish_checkbox");
      checkbox.onchange = () => this.toggleWish(wish.id);
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

      const editButton = this.createIconButton(
        "edit",
        () => this.editWish(i),
        "Edit",
      );
      const deleteButton = this.createIconButton(
        "delete",
        () => this.deleteWish(i),
        "Delete",
      );

      container.appendChild(editButton);
      container.appendChild(deleteButton);

      const buttonWrapper = document.createElement("div");
      buttonWrapper.className = "itemButtons";

      buttonWrapper.appendChild(editButton);
      buttonWrapper.appendChild(deleteButton);

      li.appendChild(container);
      li.appendChild(buttonWrapper);
      list.appendChild(li);
    });
  },
  createIconButton(iconText, onclick, title = "") {
    const button = document.createElement("button");
    button.className = "icon-button";

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
    if (
      !this.events[this.currentEvent] ||
      this.events[this.currentEvent].length === 0
    ) {
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
  },
};
