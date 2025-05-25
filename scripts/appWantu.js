export const AppWantu = {
  events: [],
  wishes: [],
  currentEventId: null,
  eventDelete: null,
  dbClient: null,

  init: async function (dbClient) {
    this.dbClient = dbClient;

    await this.getEventsFromDB();

    this.prepareAddEventForm();
    this.prepareAddWishForm();

    document.getElementById("confirmDelete").onclick =
      this.deleteEvent.bind(this);
    document.getElementById("cancelDelete").onclick = this.closeDeleteModal;

    document.getElementById("savePDF").onclick = this.saveToPDF.bind(this);

    this.renderEvents();
    this.renderWishes();
  },
  async getEventsFromDB() {
    // TODO: process errors
    const { data, error } = await this.dbClient.from("events").select();
    this.events = data;
  },
  async addEventToDB(eventTitle) {
    const response = await this.dbClient
      .from("events")
      .insert({ title: eventTitle })
      .select();
    return response;
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
  async saveWishToDB(wish) {
    const { error } = await this.dbClient
      .from("wishes")
      .update({ title: wish.title, link: wish.link })
      .eq("id", wish.id);

    if (error) {
      console.error("[saveWishToDB] ", error);
    } else {
      this.wishes.find((w) => w.id === wish.id).title = wish.title;
      this.wishes.find((w) => w.id === wish.id).link = wish.link;
    }
  },
  async deleteEventFromDB() {
    const response = await this.dbClient
      .from("events")
      .delete()
      .eq("id", this.eventDelete);
    return response;
  },
  async addWishToDB(title, link) {
    const response = await this.dbClient
      .from("wishes")
      .insert({ title, link, event_id: this.currentEventId })
      .select();
    return response;
  },
  async wishStatusToDB(isDone, wishId) {
    const response = await this.dbClient
      .from("wishes")
      .update({ done: isDone })
      .eq("id", wishId);
    return response;
  },
  async deleteWishFromDB(wishId) {
    const response = await this.dbClient
      .from("wishes")
      .delete()
      .eq("id", wishId);
    return response;
  },
  async getWishesFromDB() {
    const response = await this.dbClient
      .from("wishes")
      .select("*")
      .eq("event_id", this.currentEventId);
    return response;
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
      liElement.className = event.id === this.currentEventId ? "active" : "";
      liElement.setAttribute("data-eventid", event.id);
      eventWithControls.onclick = (e) => {
        if (
          e.target.classList.contains("eventWithControls") ||
          e.target.tagName === "SPAN"
        ) {
          this.currentEventId = event.id;
          this.renderEvents();
          this.renderWishes();
        }
      };

      const editButton = this.createIconButton(
        "edit",
        () => this.editEvent(event),
        "Edit"
      );
      const deleteButton = this.createIconButton(
        "delete",
        () => this.showDeleteModal(event),
        "Delete"
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
  prepareAddEventForm: function () {
    const sideMenu = document.getElementById("sideMenu");
    const sidebarEventForm = document.createElement("div");
    sidebarEventForm.className = "sidebarEventForm";

    const input = document.createElement("input");
    input.id = "newEventInput";
    input.type = "text";
    input.placeholder = "Create an event";

    const button = document.createElement("button");
    button.id = "addEvent";
    button.innerText = "Add";

    sidebarEventForm.appendChild(input);
    sidebarEventForm.appendChild(button);
    sideMenu.appendChild(sidebarEventForm);

    document.getElementById("addEvent").onclick = this.addEvent.bind(this);
    document
      .getElementById("newEventInput")
      .addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          this.addEvent();
        }
      });
  },
  addEvent: async function () {
    const input = document.getElementById("newEventInput");
    const eventTitle = input.value.trim();

    if (!eventTitle) {
      alert("Enter an event title");
      return;
    }

    if (this.events.some((event) => event.title === eventTitle)) {
      alert(`Name "${eventTitle}" already in your events list.`);
      return;
    }

    const { data, error } = await this.addEventToDB(eventTitle);

    if (error) {
      console.error("[addEvent] ", error);
    } else {
      const createdEvent = data[0];
      this.currentEventId = createdEvent.id;
      this.events.push(createdEvent);
      this.renderEvents();
      this.renderWishes();
      input.value = "";
    }
  },
  deleteEvent: async function () {
    const eventIndex = this.events.findIndex((e) => e.id === this.eventDelete);
    if (this.eventDelete && eventIndex >= 0) {
      const response = await this.deleteEventFromDB();

      if (response.error) {
        console.error("[deleteEvent] ", response.error);
      } else {
        if (this.currentEventId === this.eventDelete) {
          this.currentEventId = null;
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
      `[data-eventid="${event.id}"]`
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
  prepareAddWishForm: function () {
    const container = document.getElementById("addWishForm");
    this.createWishForm(container);
  },
  addWish: async function () {
    const container = document.getElementById("addWishForm");
    const titleInput = container.querySelector('[data-form_el="title"]');
    const linkInput = container.querySelector('[data-form_el="link"]');

    const title = titleInput.value.trim();
    const link = linkInput.value.trim();
    if (!title) return alert("Please, enter a wish title");

    const { data, error } = await this.addWishToDB(title, link);

    if (error) {
      console.error("[addWish] ", error);
    } else {
      const createdWish = data[0];
      this.wishes.push(createdWish);
      this.renderWishes();
      titleInput.value = "";
      linkInput.value = "";
    }
  },
  toggleWish: async function (wishId) {
    const wish = this.wishes.find((w) => w.id === wishId);
    const newStatus = !wish.done;

    const { error } = await this.wishStatusToDB(newStatus, wishId);

    if (error) {
      console.error(`[toggleWish] ${error}`);
    } else {
      wish.done = newStatus;
      this.renderWishes();
    }
  },
  saveWish: async function (wish) {
    const list = document.getElementById("wishList");
    const li = list.querySelector(`[data-wishid="${wish.id}"]`);
    const inputs = li.querySelectorAll("input");
    const title = inputs[1].value;
    const link = inputs[2].value;
    wish.title = title;
    wish.link = link;
    await this.saveWishToDB(wish);
    this.renderWishes();
  },
  editWish: function (wishId) {
    const list = document.getElementById("wishList");
    const li = list.querySelector(`[data-wishid="${wishId}"]`);
    const wishLabel = li.querySelector(".wishLabel");
    const itemButtons = li.querySelector(".itemButtons");
    wishLabel.style.display = "none";
    itemButtons.style.display = "none";
    this.editWishForm(li, wishId);
  },
  editWishForm: function (li, wishId) {
    const wish = this.wishes.find((w) => w.id === wishId);
    this.createWishForm(li, wish);
  },
  createWishForm: function (container, wish) {
    let inputTitle = document.createElement("input");
    inputTitle.placeholder = "Title";
    inputTitle.type = "text";
    inputTitle.setAttribute("data-form_el", "title");

    let inputLink = document.createElement("input");
    inputLink.placeholder = "Link";
    inputLink.type = "text";
    inputLink.setAttribute("data-form_el", "link");

    const saveButton = document.createElement("button");
    saveButton.textContent = wish ? "Save" : "Add Wish";

    if (wish?.title) {
      inputTitle.value = wish.title;
    }

    if (wish?.link) {
      inputLink.value = wish.link;
    }

    if (wish) {
      saveButton.onclick = () => this.saveWish(wish);
    } else {
      saveButton.onclick = () => this.addWish();
    }

    container.appendChild(inputTitle);
    container.appendChild(inputLink);
    container.appendChild(saveButton);
  },
  deleteWish: async function (wishId) {
    const wishIndex = this.wishes.findIndex((w) => w.id === wishId);
    if (wishIndex >= 0) {
      const { error } = await this.deleteWishFromDB(wishId);

      if (error) {
        console.error("[deleteWish] ", error);
      } else {
        // delete from local db
        this.wishes.splice(wishIndex, 1);
        this.renderWishes();
      }
    }
  },
  renderWishes: async function () {
    const title = document.getElementById("eventTitle");
    const list = document.getElementById("wishList");

    if (!this.currentEventId) {
      list.style.display = "none";
      title.textContent = "Select an event";
      document.querySelector(".wishes_controls").style.display = "none";
      document.querySelector(".savePDF").style.display = "none";
      return;
    }

    document.querySelector(".wishes_controls").style.display = "flex";
    document.querySelector(".savePDF").style.display = "flex";

    const { data, error } = await this.getWishesFromDB();

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
      (event) => event.id === this.currentEventId
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
        () => this.editWish(wish.id),
        "Edit"
      );
      const deleteButton = this.createIconButton(
        "delete",
        () => this.deleteWish(wish.id),
        "Delete"
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
  saveToPDF: function () {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const eventTitle = this.events.filter(
      (event) => event.id === this.currentEventId
    )[0].title;

    doc.setFontSize(14);
    doc.text(eventTitle, 10, 10);

    let y = 20;
    if (!this.wishes) {
      alert("This event has no wishes to export.");
      return;
    }

    this.wishes.forEach((wish, index) => {
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

    doc.save(`${eventTitle}.pdf`);
  },
};
