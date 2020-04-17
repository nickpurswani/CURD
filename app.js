var express = require("express");
var app = express();
var HTTP_PORT=8000;
var User = require("./models/user");
var Comment = require("./models/comment");
var methodOverride = require("method-override");
var mongoose = require("mongoose");
var passport = require("passport");
var LocalStrategy = require("passport-local");
var flash =require("connect-flash"); 
// Map global promises
mongoose.Promise = global.Promise;
// Mongoose Connect
mongoose.connect('mongodb://localhost:27017/curd', {useNewUrlParser: true})
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.log(err));mongoose.set("useCreateIndex", true);
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
  // we're connected!
})
app.use(flash());

app.use(require("express-session")({
    secret: "Once again Rusty wins cutest dog!",
    resave: false,
    saveUninitialized: false
    }));
    app.use(passport.initialize());
    app.use(passport.session());
    passport.use(new LocalStrategy(User.authenticate()));
    passport.serializeUser(User.serializeUser());
    passport.deserializeUser(User.deserializeUser());
    
var bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));
app.use(methodOverride("_method"));
app.set("view engine","ejs");
app.use(function(req,res,next){
    res.locals.currentUser = req.user;
    res.locals.error = req.flash("error");
    res.locals.success = req.flash("success");
    next();
    });
app.get('/',(req,res)=>{
res.render("index");
});
app.get("/register",function(req,res){
    res.render("register");
    });
    app.post("/register",function(req,res){
    var newUser = new User({username:req.body.username});
    User.register(newUser,req.body.password,function(err,user){
    if(err){
        req.flash("error",err.message);
    console.log(err);
    return res.render("register");
    }
    passport.authenticate("local")(req,res,function(){
        req.flash("success","Welcome to CRUD "+user.username);
    res.redirect("/");
    })
    })
    });
    //login form
    app.get("/login",function(req,res){
    res.render("login");
    });

    app.post("/login",passport.authenticate("local",{
    successRedirect :"/",
    failureRedirect : "/login",
    failureFlash: true,
    successFlash: 'Welcome to CRUD!'
    })
    );
    app.get("/logout",function(req,res){
    req.logout();
    req.flash("success","Logged You Out!")
    res.redirect("/");
    });
    app.get("/curd",isLoggedIN, (req,res)=>{
       Comment.find({'username':req.user.username},(err,comment)=>{
           
        res.render("show",{comment:comment});
       });
    });
    app.get("/curd/new",isLoggedIN,function(req , res){
    res.render("new");    
        });
        app.post("/curd/new",isLoggedIN,function(req,res){
        
        Comment.create(req.body.comment,function(err,comment){
        if(err){
        console.log(err);
        }
        else{
            res.redirect("/curd");
        }
        });
        
        });
        //edit
        app.get('/curd/:comment_id/edit',(req,res)=>{
            
            Comment.findById(req.params.comment_id,function(err,comment){
        res.render("edit",{comment:comment});
        });
        });
        //update
        app.put('/curd/:comment_id',(req,res)=>{
            
        Comment.findByIdAndUpdate(req.params.comment_id,req.body.comment,(err,updte)=>{
        if(err)res.redirect("back");
        else{
           
            res.redirect("/curd");
        }
        });
        });
        //delete
        app.delete('/curd/:comment_id',(req,res)=>{
            Comment.findByIdAndRemove({_id:req.params.comment_id},(err)=>{
                if(err)res.redirect("back");
                else{
                    
                    res.redirect("/curd");
                }
            });
        });

app.listen(process.env.PORT || HTTP_PORT, () => {
    console.log("Server running on port %PORT%".replace("%PORT%", HTTP_PORT))
  });
function isLoggedIN(req,res,next){
    if(req.isAuthenticated()){
    return next();
    }
    req.flash("error", "You need to be logged in to do that");
    res.redirect("/login");
    };