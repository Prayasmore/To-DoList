const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");
require("dotenv").config();

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect(process.env.MONGODB_URI);

const itemsSchema = {
  name: String
};

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
  name: "Welcome to your todolist!"
});

const item2 = new Item({
  name: "Hit the + button to add a new item."
});

const item3 = new Item({
  name: "<-- Hit this to delete an item."
});

const defaultItems = [item1, item2, item3];

const listSchema = {
  name: String,
  items: [itemsSchema]
};

const List = mongoose.model("List", listSchema);

app.get("/", function(req, res) {

  Item.find({}).then(function(foundItems){
    if (foundItems.length === 0) {
      Item.insertMany(defaultItems);
      res.redirect("/");
    }
    else{
      res.render("list", { listTitle: "Today", newListItems: foundItems });
    }
  }).catch(function(err){
    console.log(err);
  });

});

app.get("/:customListName", (req, res) => {
 
  const customListName = _.capitalize(req.params.customListName);
 
  List.findOne({ name: customListName })
    .then((foundList) => {
      if (foundList === null) {
        
        const list = new List({
          name: customListName,
          items: defaultItems,
        });
        console.log("Title name not found, creating the new list");
        list.save();;
        res.redirect("/" + customListName);
      } else {
        console.log("Title name found");
        res.render("list", {listTitle: foundList.name, newListItems: foundList.items});
        return foundList;
      }
    })
    .catch((err) => {
      console.log(err);
    });
});

app.post("/", function(req, res){

  const itemName = req.body.newItem;
  const listName = req.body.list;
  const item = new Item({
    name: itemName
  });

  if (listName === "Today") {
    item.save();
    res.redirect("/");
  } else {
    List.findOne({ name: listName}).then( (foundList) => {
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listName);
    })
    .catch((err) => {
      console.log(err);
    });
  }

});

app.post("/delete", (req, res) => {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === "Today") {
    Item.findByIdAndRemove(checkedItemId)
    .then(function (deletedOne) {
      console.log(deletedOne);
      res.redirect("/");
    })
    .catch(function (err) {
      console.log(err);
    });
  } else {
    List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}})
    .then( (foundList) => {
      res.redirect("/" + listName);
    })
    .catch((err) => {
      console.log(err);
    });
  }

});


app.get("/about", function(req, res){
  res.render("about");
});

const port = process.env.PORT;

app.listen(port, function() {
  console.log("Server started on port " + port);
});
