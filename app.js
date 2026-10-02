/* =========================
   SUPABASE
========================= */

const SUPABASE_URL =
    "https://ckqahjskjadiqlvhrkvh.supabase.co";

const SUPABASE_KEY =
    "sb_publishable_e0jHRbgNtWllg2z3gsSXmA_PAvDx77f";

const supabaseClient =
    supabase.createClient(
        SUPABASE_URL,
        SUPABASE_KEY
    );


/* =========================
   AUTH
========================= */

const authScreen =
    document.getElementById("authScreen");

const emailInput =
    document.getElementById("emailInput");

const passwordInput =
    document.getElementById("passwordInput");

const loginButton =
    document.getElementById("loginButton");

const signupButton =
    document.getElementById("signupButton");

const authMessage =
    document.getElementById("authMessage");


/* =========================
   APP ELEMENTS
========================= */

const taskInput =
    document.getElementById("taskInput");

const categoryInput =
    document.getElementById("categoryInput");

const addButton =
    document.getElementById("addButton");

const taskList =
    document.getElementById("taskList");

const dateElement =
    document.getElementById("date");

const greetingElement =
    document.getElementById("greeting");

const taskSummary =
    document.getElementById("taskSummary");

const progressBar =
    document.getElementById("progressBar");

const progressText =
    document.getElementById("progressText");

const historyButton =
    document.getElementById("historyButton");

const todayButton =
    document.getElementById("todayButton");

const todayView =
    document.getElementById("todayView");

const historyView =
    document.getElementById("historyView");

const historyList =
    document.getElementById("historyList");


/* =========================
   DATA
========================= */

let tasks = [];
let currentUser = null;


/* =========================
   DATE
========================= */

function getToday() {

    const date = new Date();

    const year =
        date.getFullYear();

    const month =
        String(date.getMonth() + 1)
            .padStart(2, "0");

    const day =
        String(date.getDate())
            .padStart(2, "0");

    return `${year}-${month}-${day}`;
}


function formatDate(dateString) {

    const date =
        new Date(
            dateString + "T00:00:00"
        );

    return date.toLocaleDateString(
        "en-US",
        {
            weekday: "long",
            month: "long",
            day: "numeric",
            year: "numeric"
        }
    );
}


/* =========================
   HEADER
========================= */

function updateHeader() {

    const now = new Date();

    const hour =
        now.getHours();

    if (hour < 12) {

        greetingElement.textContent =
            "Good morning";

    } else if (hour < 18) {

        greetingElement.textContent =
            "Good afternoon";

    } else {

        greetingElement.textContent =
            "Good evening";
    }

    dateElement.textContent =
        now.toLocaleDateString(
            "en-US",
            {
                weekday: "long",
                month: "long",
                day: "numeric"
            }
        );
}


/* =========================
   LOAD TASKS FROM SUPABASE
========================= */

async function loadTasks() {

    const {
        data,
        error
    } = await supabaseClient
        .from("tasks")
        .select("*")
        .eq("user_id", currentUser.id)
        .order("date", {
            ascending: true
        });

    if (error) {

        console.error(error);

        alert(
            "Could not load your tasks: " +
            error.message
        );

        return;
    }

    tasks = data || [];

    displayTasks();
}


/* =========================
   MIGRATE OLD LOCAL TASKS
========================= */

async function migrateLocalTasks() {

    const alreadyMigrated =
        localStorage.getItem(
            "lifeTrackerMigrated"
        );

    if (alreadyMigrated === "true") {
        return;
    }

    const localTasks =
        JSON.parse(
            localStorage.getItem(
                "lifeTrackerTasks"
            )
        ) || [];

    if (localTasks.length === 0) {

        localStorage.setItem(
            "lifeTrackerMigrated",
            "true"
        );

        return;
    }

    const cloudTasks =
        localTasks.map(task => ({

            name:
                task.name,

            category:
                task.category || "General",

            completed:
                Boolean(task.completed),

            date:
                task.date || getToday(),

            user_id:
                currentUser.id
        }));


    const {
        error
    } = await supabaseClient
        .from("tasks")
        .insert(cloudTasks);


    if (error) {

        console.error(error);

        alert(
            "Your old tasks could not be uploaded: " +
            error.message
        );

        return;
    }


    localStorage.setItem(
        "lifeTrackerMigrated",
        "true"
    );

    console.log(
        "Old local tasks successfully uploaded."
    );
}


/* =========================
   DISPLAY TODAY
========================= */

function displayTasks() {

    taskList.innerHTML = "";

    const today =
        getToday();

    const todayTasks =
        tasks.filter(
            task =>
                task.date === today
        );


    if (todayTasks.length === 0) {

        taskList.innerHTML = `
            <div class="empty">
                Nothing planned yet. Add something you want to do today.
            </div>
        `;

    } else {

        todayTasks.forEach(task => {

            const taskDiv =
                document.createElement("div");

            taskDiv.className =
                `task ${
                    task.completed
                        ? "completed"
                        : ""
                }`;


            taskDiv.innerHTML = `

                <button class="check">
                    ${
                        task.completed
                            ? "✓"
                            : ""
                    }
                </button>

                <div class="task-content">

                    <div class="task-name"></div>

                    <div class="task-category">
                        ${
                            task.category ||
                            "General"
                        }
                    </div>

                </div>

                <button class="delete">
                    ×
                </button>

            `;


            const taskName =
                taskDiv.querySelector(
                    ".task-name"
                );

            taskName.textContent =
                task.name;


            /* COMPLETE */

            const checkButton =
                taskDiv.querySelector(
                    ".check"
                );

            checkButton.addEventListener(
                "click",
                async () => {

                    const newStatus =
                        !task.completed;


                    const {
                        error
                    } = await supabaseClient
                        .from("tasks")
                        .update({
                            completed:
                                newStatus
                        })
                        .eq(
                            "id",
                            task.id
                        )
                        .eq(
                            "user_id",
                            currentUser.id
                        );


                    if (error) {

                        alert(
                            "Could not update task: " +
                            error.message
                        );

                        return;
                    }


                    task.completed =
                        newStatus;

                    displayTasks();

                }
            );


            /* DELETE */

            const deleteButton =
                taskDiv.querySelector(
                    ".delete"
                );

            deleteButton.addEventListener(
                "click",
                async () => {

                    const {
                        error
                    } = await supabaseClient
                        .from("tasks")
                        .delete()
                        .eq(
                            "id",
                            task.id
                        )
                        .eq(
                            "user_id",
                            currentUser.id
                        );


                    if (error) {

                        alert(
                            "Could not delete task: " +
                            error.message
                        );

                        return;
                    }


                    tasks =
                        tasks.filter(
                            t =>
                                t.id !== task.id
                        );

                    displayTasks();

                }
            );


            /* EDIT */

            taskName.addEventListener(
                "dblclick",
                async () => {

                    const newName =
                        prompt(
                            "Edit task:",
                            task.name
                        );


                    if (newName === null) {
                        return;
                    }


                    const trimmed =
                        newName.trim();


                    if (trimmed === "") {
                        return;
                    }


                    const {
                        error
                    } = await supabaseClient
                        .from("tasks")
                        .update({
                            name:
                                trimmed
                        })
                        .eq(
                            "id",
                            task.id
                        )
                        .eq(
                            "user_id",
                            currentUser.id
                        );


                    if (error) {

                        alert(
                            "Could not edit task: " +
                            error.message
                        );

                        return;
                    }


                    task.name =
                        trimmed;

                    displayTasks();

                }
            );


            taskList.appendChild(
                taskDiv
            );

        });
    }


    /* =========================
       PROGRESS
    ========================= */

    const completed =
        todayTasks.filter(
            task =>
                task.completed
        ).length;


    const total =
        todayTasks.length;


    const percentage =
        total === 0
            ? 0
            : Math.round(
                (completed / total) * 100
            );


    taskSummary.textContent =
        `${completed} of ${total} completed`;


    progressBar.style.width =
        `${percentage}%`;


    progressText.textContent =
        `${percentage}%`;
}


/* =========================
   ADD TASK
========================= */

async function addTask() {

    const name =
        taskInput.value.trim();


    if (name === "") {
        return;
    }


    const newTask = {

        name:
            name,

        category:
            categoryInput.value,

        completed:
            false,

        date:
            getToday(),

        user_id:
            currentUser.id
    };


    const {
        data,
        error
    } = await supabaseClient
        .from("tasks")
        .insert(newTask)
        .select()
        .single();


    if (error) {

        alert(
            "Could not add task: " +
            error.message
        );

        return;
    }


    tasks.push(data);

    taskInput.value = "";

    displayTasks();

    taskInput.focus();
}


/* =========================
   HISTORY
========================= */

function displayHistory() {

    historyList.innerHTML = "";


    const dates = [
        ...new Set(
            tasks
                .map(
                    task =>
                        task.date
                )
                .filter(Boolean)
        )
    ];


    dates.sort().reverse();


    if (dates.length === 0) {

        historyList.innerHTML = `
            <div class="empty">
                No history yet.
            </div>
        `;

        return;
    }


    dates.forEach(date => {

        const dayTasks =
            tasks.filter(
                task =>
                    task.date === date
            );


        const completed =
            dayTasks.filter(
                task =>
                    task.completed
            ).length;


        const day =
            document.createElement("div");

        day.className =
            "history-day";


        day.innerHTML = `

            <div class="history-day-title">

                <h3>
                    ${formatDate(date)}
                </h3>

                <span class="history-count">
                    ${completed}/${dayTasks.length}
                </span>

            </div>

        `;


        dayTasks.forEach(task => {

            const historyTask =
                document.createElement("div");


            historyTask.className =
                `history-task ${
                    task.completed
                        ? "completed"
                        : ""
                }`;


            historyTask.textContent =
                `${task.completed ? "✓" : "○"} ${
                    task.name
                } · ${
                    task.category ||
                    "General"
                }`;


            day.appendChild(
                historyTask
            );

        });


        historyList.appendChild(
            day
        );

    });

}


/* =========================
   VIEW SWITCHING
========================= */

function showHistory() {

    todayView.classList.add(
        "hidden"
    );

    historyView.classList.remove(
        "hidden"
    );

    displayHistory();
}


function showToday() {

    historyView.classList.add(
        "hidden"
    );

    todayView.classList.remove(
        "hidden"
    );

    displayTasks();
}


/* =========================
   LOGIN
========================= */

async function login() {

    const email =
        emailInput.value.trim();

    const password =
        passwordInput.value;


    if (!email || !password) {

        authMessage.textContent =
            "Enter your email and password.";

        return;
    }


    authMessage.textContent =
        "Signing in...";


    const {
        data,
        error
    } =
        await supabaseClient.auth
            .signInWithPassword({
                email,
                password
            });


    if (error) {

        authMessage.textContent =
            error.message;

        return;
    }


    currentUser =
        data.user;


    await startApp();
}


/* =========================
   SIGN UP
========================= */

async function signup() {

    const email =
        emailInput.value.trim();

    const password =
        passwordInput.value;


    if (!email || !password) {

        authMessage.textContent =
            "Enter your email and password.";

        return;
    }


    authMessage.textContent =
        "Creating account...";


    const {
        error
    } =
        await supabaseClient.auth
            .signUp({
                email,
                password
            });


    if (error) {

        authMessage.textContent =
            error.message;

        return;
    }


    authMessage.textContent =
        "Account created. You can now sign in.";
}


/* =========================
   START APP
========================= */

async function startApp() {

    authScreen.style.display =
        "none";


    await migrateLocalTasks();

    await loadTasks();
}


/* =========================
   AUTH STATE
========================= */

async function checkLogin() {

    const {
        data
    } =
        await supabaseClient.auth
            .getSession();


    if (data.session) {

        currentUser =
            data.session.user;

        await startApp();

    } else {

        authScreen.style.display =
            "flex";
    }
}


/* =========================
   EVENTS
========================= */

loginButton.addEventListener(
    "click",
    login
);


signupButton.addEventListener(
    "click",
    signup
);


passwordInput.addEventListener(
    "keydown",
    event => {

        if (event.key === "Enter") {
            login();
        }

    }
);


addButton.addEventListener(
    "click",
    addTask
);


taskInput.addEventListener(
    "keydown",
    event => {

        if (event.key === "Enter") {
            addTask();
        }

    }
);


historyButton.addEventListener(
    "click",
    showHistory
);


todayButton.addEventListener(
    "click",
    showToday
);


/* =========================
   START
========================= */

updateHeader();

checkLogin();