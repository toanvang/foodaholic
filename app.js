require('dotenv').config()

const express = require("express"),
	app = express(),
	bodyParser = require("body-parser"),
	mongoose = require("mongoose"),
	passport = require("passport"),
	flash = require("connect-flash"),
	LocalStrategy = require("passport-local"),
	methodOverride = require("method-override"),
	Recipe = require("./models/recipe"),
	User = require("./models/user"),
	Comment = require("./models/comment")

const commentRoutes = require("./routes/comments"),
	reviewRoutes = require("./routes/reviews"),
	recipeRoutes = require("./routes/recipes"),
	indexRoutes = require("./routes/index")

mongoose.connect(process.env.DATABASEURL, {
	useNewUrlParser: true,
	useUnifiedTopology: true
})
	.then(() => console.log('Connected to DB!'))
	.catch(error => console.log(error.message));

app.use(bodyParser.urlencoded({ extended: true }));
app.set("view engine", "ejs");
app.use(express.static(__dirname + "/public"));
app.use(methodOverride("_method"));
app.use(flash());

app.locals.moment = require('moment');
// PASSPORT CONFIGURATION
app.use(require("express-session")({
	secret: "Rusty is the cutest dog",
	resave: false,
	saveUninitialized: false
}))

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use(function (req, res, next) {
	res.locals.currentUser = req.user;
	res.locals.error = req.flash("error");
	res.locals.success = req.flash("success");

	next();
})

app.use(indexRoutes);
app.use("/recipes", recipeRoutes);
app.use("/recipes/:id/reviews", reviewRoutes);
app.use("/recipes/:id/comments", commentRoutes);


const port = process.env.PORT || 3000;
app.listen(port, function () {
	console.log("Server Has Started!");
});		
