const express = require("express");
const router = express.Router();
const passport = require("passport");
const User = require("../models/user");

router.get("/", function (req, res) {
	res.render("landing");
});

// ===========
// AUTH ROUTES

// show register form
router.get("/register", function (req, res) {
	res.render("register");
})

// handle sign up logic
router.post("/register", function (req, res) {
	let newUser = new User({ username: req.body.username });
	User.register(newUser, req.body.password, function (err, user) {
		if (err) {
			req.flash("error", err.message);
			return res.render("register", { error: err.message })
		}
		passport.authenticate("local")(req, res, function () {
			req.flash("success", "Welcome to FoodAholic, " + req.body.username.charAt(0).toUpperCase() + req.body.username.slice(1) + "!");
			res.redirect("/recipes");
		})
	})
});

// show login form
router.get("/login", function (req, res) {
	res.render("login");
})

// login logic
router.post("/login", function (req, res, next) {
	passport.authenticate("local",
		{
			successRedirect: "/recipes",
			failureRedirect: "/login",
			failureFlash: true,
			successFlash: "Welcome to FoodAholic, " + req.body.username.charAt(0).toUpperCase() + req.body.username.slice(1) + "!"
		})(req, res);
});

// logout route
router.get("/logout", function (req, res) {
	req.logout();
	req.flash("success", "Logged you out");
	res.redirect("/recipes");
})


module.exports = router;


