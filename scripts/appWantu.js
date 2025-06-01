export const AppWantu = {
  events: [],
  wishes: [],
  currentEventId: null,
  eventIdToDelete: null,
  dbClient: null,

  init: async function (dbClient) {
    this.dbClient = dbClient;

    await this.getAllFromDB("events");

    this.prepareAddEventForm();
    this.prepareAddWishForm();

    document.getElementById("confirmDelete").onclick =
      this.deleteEvent.bind(this);
    document.getElementById("cancelDelete").onclick = this.closeDeleteModal;

    document.getElementById("savePDF").onclick = this.saveToPDF.bind(this);

    this.renderEvents();
    this.showWishes();
  },

  async getAllFromDB(dbName) {
    const baseQuery = this.dbClient.from(dbName).select("*");
    const query =
      dbName === "events"
        ? baseQuery
        : baseQuery.eq("event_id", this.currentEventId);

    const { data, error } = await query;

    if (error) {
      console.error("[getAllFromDB]", dbName, error);
      return;
    }
    dbName === "events" ? (this.events = data) : (this.wishes = data);
  },
  async addToDB(dbName, resource) {
    return await this.dbClient.from(dbName).insert(resource).select();
  },
  async saveToDB(dbName, resource) {
    const { error } = await this.dbClient
      .from(dbName)
      .update(resource)
      .eq("id", resource.id);

    if (error) {
      const resourceName = this.resourceNameToSingleton(dbName);
      console.error(`[save${resourceName}ToDB] `, error);
    } else {
      this.updateLocalResource(dbName, resource);
    }
  },
  async deleteFromDB(dbName, id) {
    return await this.dbClient.from(dbName).delete().eq("id", id);
  },
  async wishStatusToDB(isDone, wishId) {
    const response = await this.dbClient
      .from("wishes")
      .update({ done: isDone })
      .eq("id", wishId);
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
          this.showWishes();
        }
      };

      const editButton = this.createIconButton(
        "edit",
        () => this.editEvent(event),
        "Edit",
      );
      const deleteButton = this.createIconButton(
        "delete",
        () => {
          this.eventIdToDelete = event.id;
          this.showDeleteModal();
        },
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
    const title = input.value.trim();

    if (!title) {
      alert("Enter an event title");
      return;
    }

    if (this.events.some((event) => event.title === title)) {
      alert(`Name "${title}" already in your events list.`);
      return;
    }

    const { data, error } = await this.addToDB("events", { title });

    if (error) {
      console.error("[addEvent] ", error);
    } else {
      const createdEvent = data[0];
      this.currentEventId = createdEvent.id;
      this.events.push(createdEvent);
      this.renderEvents();
      this.showWishes();
      input.value = "";
    }
  },
  deleteEvent: async function () {
    const eventIndex = this.events.findIndex(
      (e) => e.id === this.eventIdToDelete,
    );
    if (this.eventIdToDelete && eventIndex >= 0) {
      const response = await this.deleteFromDB("events", this.eventIdToDelete);

      if (response.error) {
        console.error("[deleteEvent] ", response.error);
      } else {
        if (this.currentEventId === this.eventIdToDelete) {
          this.currentEventId = null;
        }
        // delete from local db
        this.events.splice(eventIndex, 1);
        this.renderEvents();
        this.showWishes();
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

    await this.saveToDB("events", newEvent);
    this.renderEvents();
    this.showWishes();
  },
  showDeleteModal: function () {
    document.getElementById("confirmModal").classList.remove("hidden");
  },
  closeDeleteModal: function () {
    this.eventIdToDelete = null;
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

    const { data, error } = await this.addToDB("wishes", {
      title,
      link,
      event_id: this.currentEventId,
    });

    if (error) {
      console.error("[addWish] ", error);
    } else {
      const createdWish = data[0];
      this.wishes.push(createdWish);
      this.showWishes();
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
      this.showWishes();
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
    await this.saveToDB("wishes", wish);
    this.showWishes();
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
      const { error } = await this.deleteFromDB("wishes", wishId);

      if (error) {
        console.error("[deleteWish] ", error);
      } else {
        // delete from local db
        this.wishes.splice(wishIndex, 1);
        this.showWishes();
      }
    }
  },
  showWishes: async function () {
    this.toggleViewWithoutSelectedEvent();
    if (!this.currentEventId) return;

    document.querySelector(".wishes_controls").style.display = "flex";
    document.querySelector(".savePDF").style.display = "flex";

    // show selected event's name on top of the wishes list
    const title = document.getElementById("eventTitle");
    title.textContent = this.events.filter(
      (event) => event.id === this.currentEventId,
    )[0].title;

    await this.getAllFromDB("wishes");
    this.renderWishes();
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
      (event) => event.id === this.currentEventId,
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
  updateLocalResource(resourceType, resource) {
    switch (resourceType) {
      case "events":
        this.events.find((ev) => ev.id === resource.id).title = resource.title;
        return;
      case "wishes":
        this.wishes.find((w) => w.id === resource.id).title = resource.title;
        this.wishes.find((w) => w.id === resource.id).link = resource.link;
        return;
      default:
        return;
    }
  },
  resourceNameToSingleton(dbName) {
    return dbName === "events" ? "Event" : "Wish";
  },
  toggleViewWithoutSelectedEvent() {
    const title = document.getElementById("eventTitle");
    const list = document.getElementById("wishList");
    const eventTitleContainer = document.getElementById("wishListData");

    if (this.currentEventId) {
      eventTitleContainer.classList.remove("no-event-selected");
      return;
    }

    eventTitleContainer.classList.add("no-event-selected");
    list.style.display = "none";

    title.innerHTML = `<img src="img/img_select_event.svg">You need to select an event.`;
    document.querySelector(".wishes_controls").style.display = "none";
    document.querySelector(".savePDF").style.display = "none";
  },
  renderWishes() {
    const list = document.getElementById("wishList");
    // if no wishes - hide white box
    list.style.display = this.wishes.length ? "block" : "none";

    const sortedWishes = this.wishes.sort(
      (a, b) => Date.parse(b.created_at) - Date.parse(a.created_at),
    );

    list.innerHTML = "";
    sortedWishes.forEach((wish) => {
      const li = document.createElement("li");
      li.setAttribute("data-wishid", wish.id);

      const container = document.createElement("div");
      container.className = "wishLabel";

      container.appendChild(this.createWishCheckbox(wish));
      container.appendChild(this.createWishTitle(wish));

      li.appendChild(container);
      li.appendChild(this.createWishButtons(wish));

      list.appendChild(li);
    });
  },
  createWishCheckbox(wish) {
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = wish.done;
    checkbox.classList.add("wish_checkbox");
    checkbox.onchange = () => this.toggleWish(wish.id);

    return checkbox;
  },
  createWishTitle(wish) {
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
      this.showWishes();
    };

    return titleElement;
  },
  createWishButtons(wish) {
    const buttonWrapper = document.createElement("div");
    buttonWrapper.className = "itemButtons";

    const editButton = this.createIconButton(
      "edit",
      () => this.editWish(wish.id),
      "Edit",
    );
    const deleteButton = this.createIconButton(
      "delete",
      () => this.deleteWish(wish.id),
      "Delete",
    );

    buttonWrapper.appendChild(editButton);
    buttonWrapper.appendChild(deleteButton);

    return buttonWrapper;
  },
};
