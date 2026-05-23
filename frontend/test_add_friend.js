(async () => {
    const res = await fetch("https://openbox-0tuh.onrender.com/user/friends", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ friendId: "123" }) // No auth token
    });
    console.log(res.status, await res.text());
})();
