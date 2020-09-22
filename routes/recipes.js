const express = require("express");
const router = express.Router();
const Recipe = require("../models/recipe");
const Review = require("../models/review");
const middleware = require("../middleware");
const multer = require("multer");
const storage = multer.diskStorage({
  filename: function (req, file, callback) {
    callback(null, Date.now() + file.originalname);
  }
});
const imageFilter = function (req, file, cb) {
  // accept image files only
  if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
    return cb(new Error("Only image files are allowed!"), false);
  }
  cb(null, true);
};
const upload = multer({ storage: storage, fileFilter: imageFilter })

const cloudinary = require("cloudinary");
cloudinary.config({
  cloud_name: "tvang",
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});
// INDEX - show all recipes
router.get("/", function (req, res) {
  let noMatch = null;
  if (req.query.search) {
    const regex = new RegExp(escapeRegex(req.query.search), "gi");
    // Get all recipes from DB
    Recipe.find({ name: regex }, function (err, allRecipes) {
      if (err) {
        console.log(err);
      } else {
        if (allRecipes.length < 1) {
          noMatch = "No recipe match that query, please try again.";
        }
        res.render("recipes/index", { recipes: allRecipes, noMatch: noMatch });
      }
    });
  } else {
    // Get all recipes from DB
    Recipe.find({}, function (err, allRecipes) {
      if (err) {
        console.log(err);
      } else {
        res.render("recipes/index", { recipes: allRecipes, noMatch: noMatch });
      }
    });
  }
});

//CREATE - add new recipe to DB
router.post("/", middleware.isLoggedIn, upload.single("image"), function (req, res) {
  cloudinary.v2.uploader.upload(req.file.path, function (err, result) {
    if (err) {
      req.flash("error", err.message);
      return res.redirect("back");
    }
    // add cloudinary url for the image to the recipe object under image property
    req.body.recipe.image = result.secure_url;
    // add image's public_id to recipe object
    req.body.recipe.imageId = result.public_id;
    // add author to recipe
    req.body.recipe.author = {
      id: req.user._id,
      username: req.user.username
    }
    Recipe.create(req.body.recipe, function (err, recipe) {
      if (err) {
        req.flash("error", err.message);
        return res.redirect("error");
      }
      res.redirect("/recipes/" + recipe.id);
    });
  });
});

// NEW - show form to create new recipe
router.get("/new", middleware.isLoggedIn, function (req, res) {
  res.render("recipes/new");
});

// SHOW - show more info about one recipe
// find recipe with provided ID
// router.get("/:id", function(req, res){
// 	Recipe.findById(req.params.id).populate("comments").exec(function(err, foundRecipe){
// 		if(err){
// 			console.log(err)
// 		}
// 		else{
// 			// render show template with that recipe
// 			res.render("recipes/show", {recipe: foundRecipe});
// 		}
// 	});
// });
router.get("/:id", function (req, res) {
  //find the recipe with provided ID
  Recipe.findById(req.params.id).populate("comments").populate({
    path: "reviews",
    options: { sort: { createdAt: -1 } }
  }).exec(function (err, foundRecipe) {
    if (err) {
      console.log(err);
    } else {
      //render show template with that recipe
      res.render("recipes/show", { recipe: foundRecipe });
    }
  });
});

// EDIT RECIPE ROUTE
router.get("/:id/edit", middleware.checkRecipeOwnership, function (req, res) {
  // is user logged findById
  Recipe.findById(req.params.id, function (err, foundRecipe) {
    if (err) {
      res.redirect("/recipes");
    }
    else {
      res.render("recipes/edit", { recipe: foundRecipe });
    }
  });
});

// UPDATE RECIPE ROUTE
router.put("/:id", upload.single("image"), function (req, res) {
  Recipe.findById(req.params.id, async function (err, recipe) {
    if (err) {
      req.flash("error", err.message);
      res.redirect("back");
    } else {
      if (req.file) {
        try {
          await cloudinary.v2.uploader.destroy(recipe.imageId);
          let result = await cloudinary.v2.uploader.upload(req.file.path);
          recipe.imageId = result.public_id;
          recipe.image = result.secure_url;
        } catch (err) {
          req.flash("error", err.message);
          return res.redirect("back");
        }
      }
      recipe.name = req.body.name;
      recipe.description = req.body.description;
      recipe.difficulty = req.body.difficulty;
      recipe.save();
      req.flash("success", "Successfully Updated!");
      res.redirect("/recipes/" + recipe._id);
    }
  });
});

// DESTROY ROUTE
router.delete("/:id", function (req, res) {
  Recipe.findById(req.params.id, async function (err, recipe) {
    if (err) {
      req.flash("error", err.message);
      return res.redirect("back");
    }
    try {
      await cloudinary.v2.uploader.destroy(recipe.imageId);
      recipe.remove();
      req.flash("success", "Recipe deleted successfully!");
      res.redirect("/recipes");
    } catch (err) {
      if (err) {
        req.flash("error", err.message);
        return res.redirect("back");
      }
    }
  });
});

// Use for fuzzy search. Find matching character
function escapeRegex(text) {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};


module.exports = router;
