// all the middleware goes here
const Recipe = require("../models/recipe");
const Comment = require("../models/comment");
const Review = require("../models/review");
const middlewareObj = {};

// check if user own the recipe
middlewareObj.checkRecipeOwnership = function (req, res, next) {
	if (req.isAuthenticated()) {
		Recipe.findById(req.params.id, function (err, foundRecipe) {
			if (err) {
				req.flash("error", "Recipe not found");
				res.redirect("back");
			} else {
				// does user own the recipe?
				if (foundRecipe.author.id.equals(req.user._id)) {
					next();
				} else {
					req.flash("error", "You don't have permission to do that");
					res.redirect("back");
				}
			}
		});
	}
	else {
		req.flash("error", "You need to logged in to do that");
		res.redirect("back");
	}
}

// check if user own the comment
middlewareObj.checkCommentOwnership = function (req, res, next) {
	if (req.isAuthenticated()) {
		Comment.findById(req.params.comment_id, function (err, foundComment) {
			if (err) {
				res.redirect("back");
			} else {
				// does user own the comment?
				if (foundComment.author.id.equals(req.user._id)) {
					next();
				} else {
					req.flash("error", "You don't have permissionto do that");
					res.redirect("back");
				}
			}
		});
	}
	else {
		req.flash("error", "You need to be logged in to do that");
		res.redirect("back");
	}
}

// check if user is logged in
middlewareObj.isLoggedIn = function (req, res, next) {
	if (req.isAuthenticated()) {
		return next();
	}
	req.flash("error", "You need to be logged in to do that");
	res.redirect("/login");
}

// check if user own the review
middlewareObj.checkReviewOwnership = function (req, res, next) {
	if (req.isAuthenticated()) {
		Review.findById(req.params.review_id, function (err, foundReview) {
			if (err || !foundReview) {
				res.redirect("back");
			} else {
				// does user own the comment?
				if (foundReview.author.id.equals(req.user._id)) {
					next();
				} else {
					req.flash("error", "You don't have permission to do that");
					res.redirect("back");
				}
			}
		});
	} else {
		req.flash("error", "You need to be logged in to do that");
		res.redirect("back");
	}
};

middlewareObj.checkReviewExistence = function (req, res, next) {
	if (req.isAuthenticated()) {
		Recipe.findById(req.params.id).populate("reviews").exec(function (err, foundRecipe) {
			if (err || !foundRecipe) {
				req.flash("error", "Recipe not found.");
				res.redirect("back");
			} else {
				// check if req.user._id exists in foundRecipe.reviews
				let foundUserReview = foundRecipe.reviews.some(function (review) {
					return review.author.id.equals(req.user._id);
				});
				if (foundUserReview) {
					req.flash("error", "You already wrote a review.");
					return res.redirect("/recipes/" + foundRecipe._id);
				}
				// if the review was not found, go to the next middleware
				next();
			}
		});
	} else {
		req.flash("error", "You need to login first.");
		res.redirect("back");
	}
};

module.exports = middlewareObj;
