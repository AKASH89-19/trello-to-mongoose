/*
Data Schemas:
USERS: { ID: Number, username: String, password: String }
ORGANISATION: { ID: Number, name: String, createdBy: Number, members: Number[] }
BOARD: { ID: Number, name: String, organisationId: Number, createdBy: Number }
ISSUE: { ID: Number, title: String, description: String, status: String, boardId: Number, createdBy: Number }
*/

const express = require("express");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const { authmiddleware } = require("./middleware");
const {organisationmodule,usermodule} = require("./module")

const ISSUE = [];
const BOARD = [];

/*let USERS_ID = 1;
let ORGANISATION_ID = 1;
let ISSUE_ID = 1;
let BOARD_ID = 1;\
when the mongoose data base is not given
*/

const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
    res.send("Server is working!");
});

app.post("/signup", async function(req, res) {
    const username = req.body.username;
    const password = req.body.password;

    if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
    }

  //  const usernameexist = USERS.find(u => u.username === username);
  const  usernameexist = await usermodule.findOne({
    username: username,
  }) 
  if(usernameexist) {
        return res.status(403).json({ message: "User already exists" });
    }

   /* const newUser = {
        username: username,
        password: password,
        ID: USERS_ID++
    };
    USERS.push(newUser); */
const newUser = await usermodule.create({
    username: username,
    password: password
})

    res.json({ message: "You have signed up successfully",id: newUser._id });
});

app.post("/signin", async function(req, res) { 
    const username = req.body.username;
    const password = req.body.password;
     if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
    }

    //const user = USERS.find(u => u.username === username && u.password === password);
      const  usersid = await usermodule.findOne({
    username: username,
    password: password
  }) 
    if(!usersid) {
        return res.status(403).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign({ usersid: usersid }, "atlantision1234");
    res.json({ token: token });
});

// Create Organisation
app.post("/organisation", authmiddleware, async function(req, res){
    const name = req.body.name;
    if (!name) return res.status(400).json({ message: "Organisation name is required" });
    const usersId = req.usersid 
    /*const newOrg = {
        ID: ORGANISATION_ID++,
        name: name,
        createdBy: req.usersid,
        members: [req.usersid] // creator is automatically a member
    };
    ORGANISATION.push(newOrg);*/
    const neworg = await organisationmodule.create({
        title : req.body.title,
        description : req.body.description,
        admin : usersId,
        members : []
    })
    res.json({ message: "Organisation created", organisation: neworg });
});

// Add members to organisation
app.post("/add-members-to-organisation", authmiddleware, async function(req, res){
    const usersId = req.usersid
    const  organisationId = req.body;
    const memberusername = req.body.memberusername
    
    if (!organisationId || !userId) {
        return res.status(400).json({ message: "organisationId and userId are required" });
    }

    /*const org = ORGANISATION.find(o => o.ID === organisationId);
    if (!org) return res.status(404).json({ message: "Organisation not found" });
    
    // Check if the requester is part of the org or created it
    if (org.createdBy !== req.usersid) {
        return res.status(403).json({ message: "Only the creator can add members" });
    }

    const userToAdd = USERS.find(u => u.ID === userId);
    if (!userToAdd) return res.status(404).json({ message: "User not found" });

    if (!org.members.includes(userId)) {
        org.members.push(userId);
    }*/
   
    const organisation = await organisationmodule.findOne({
          _id : organisationId
    })
    if(organisation || organisation.admin.toString() !== userId)
        {
            res.json({
                message : "either org doesn't exists or organisation is not created by the admin"
            })
        } 
    const memberuser = await usermodule.findOne({
        username: memberusername
    })    
    if(!memberuser)
    {
        res.json({
            message :  "member does not exist "
        })
    }
    await organisationmodule.updateOne({
         _id: organisationId
        },{
           $push: {
              "members" : memberuser._id
           }
         })

    res.json({ message: "Member added successfully", organisation: org });
});

// Create Board
app.post("/boards", authmiddleware, function(req, res){
    const { name, organisationId } = req.body;
    if (!name || !organisationId) return res.status(400).json({ message: "Name and organisationId are required" });

    const org = ORGANISATION.find(o => o.ID === organisationId);
    if (!org) return res.status(404).json({ message: "Organisation not found" });

    // Check if user is a member of the organisation
    if (!org.members.includes(req.usersid)) {
        return res.status(403).json({ message: "You are not a member of this organisation" });
    }

    const newBoard = {
        ID: BOARD_ID++,
        name: name,
        organisationId: organisationId,
        createdBy: req.usersid
    };
    BOARD.push(newBoard);
    res.json({ message: "Board created", board: newBoard });
});

// Get organisations for the authenticated user
app.get("/organisation", authmiddleware, async function(req, res){
 const usersId = req.usersid
 const organisationId = req.query.organisationId
 const organisation = await organisationmodule.findOne({
    _id : organisationId
 })
 if(!organisation || organisationId !== userId)
 {
    res.json({
        message : "Either this organisation doesnt exist or the admin of this organistaion is not you "
    })
    return 
 }
 res.json({
   organisation: {
    title : organisation.title,
    description : organisation.description,
    members : members.map(m =>({
        username: m.username,
        id: m._id
    }))
   }
 })
});

// Create Issue or Update Issue Status
app.post("/issue", authmiddleware, function(req, res){
    const { id, title, description, status, boardId } = req.body;
    
    // If ID is provided, treat it as an update (specifically for status)
    if (id) {
        const issue = ISSUE.find(i => i.ID === parseInt(id));
        if (!issue) return res.status(404).json({ message: "Issue not found" });
        
        const board = BOARD.find(b => b.ID === issue.boardId);
        const org = ORGANISATION.find(o => o.ID === board.organisationId);
        if (!org.members.includes(req.usersid)) {
            return res.status(403).json({ message: "You are not a member of this organisation" });
        }

        if (status) issue.status = status;
        if (title) issue.title = title;
        if (description !== undefined) issue.description = description;
        
        return res.json({ message: "Issue updated", issue });
    }

    if (!title || !boardId) return res.status(400).json({ message: "Title and boardId are required" });

    const board = BOARD.find(b => b.ID === boardId);
    if (!board) return res.status(404).json({ message: "Board not found" });

    const newIssue = {
        ID: ISSUE_ID++,
        title: title,
        description: description || "",
        status: status || "TODO", // TODO, IN_PROGRESS, DONE
        boardId: boardId,
        createdBy: req.usersid
    };
    ISSUE.push(newIssue);
    res.json({ message: "Issue created", issue: newIssue });
});

// READ end points
// Get boards for the authenticated user (by checking organisations they belong to)
app.get("/boards", authmiddleware, function(req, res){
    // Find all orgs the user is a member of
    const userOrgs = ORGANISATION.filter(o => o.members.includes(req.usersid)).map(o => o.ID);
    // Find all boards that belong to those orgs
    const userBoards = BOARD.filter(b => userOrgs.includes(b.organisationId));
    res.json({ boards: userBoards });
});

// Get boards for a specific organisation
app.get("/boards/organisation", authmiddleware, function(req, res){
    const organisationId = parseInt(req.query.organisationId);
    if (!organisationId) return res.status(400).json({ message: "organisationId query parameter is required" });
    
    const org = ORGANISATION.find(o => o.ID === organisationId);
    if (!org) return res.status(404).json({ message: "Organisation not found" });

    if (!org.members.includes(req.usersid)) {
        return res.status(403).json({ message: "You are not a member of this organisation" });
    }

    const orgBoards = BOARD.filter(b => b.organisationId === organisationId);
    res.json({ boards: orgBoards });
});

// Get issues for a specific board
app.get("/issue", authmiddleware, function(req, res){
    const boardId = parseInt(req.query.boardId);
    if (!boardId) return res.status(400).json({ message: "boardId query parameter is required" });

    const board = BOARD.find(b => b.ID === boardId);
    if (!board) return res.status(404).json({ message: "Board not found" });

    // Assuming if you can see the board, you can see its issues
    const boardIssues = ISSUE.filter(i => i.boardId === boardId);
    res.json({ issues: boardIssues });
});

// Get members of an organisation
app.get("/members", authmiddleware, function(req, res){
    const organisationId = parseInt(req.query.organisationId);
    if (!organisationId) return res.status(400).json({ message: "organisationId query parameter is required" });

    const org = ORGANISATION.find(o => o.ID === organisationId);
    if (!org) return res.status(404).json({ message: "Organisation not found" });

    if (!org.members.includes(req.usersid)) {
        return res.status(403).json({ message: "You are not a member of this organisation" });
    }

    const members = USERS.filter(u => org.members.includes(u.ID)).map(u => ({ ID: u.ID, username: u.username }));
    res.json({ members: members });
});

// Remove a member from an organisation
app.delete("/members", authmiddleware, async function(req, res){
     const usersId = req.usersid
    const  organisationId = req.body;
    const memberusername = req.body.memberusername
    
    if (!organisationId || !userId) {
        return res.status(400).json({ message: "organisationId and userId are required" });
    }

    /*const org = ORGANISATION.find(o => o.ID === organisationId);
    if (!org) return res.status(404).json({ message: "Organisation not found" });
    
    // Check if the requester is part of the org or created it
    if (org.createdBy !== req.usersid) {
        return res.status(403).json({ message: "Only the creator can add members" });
    }

    const userToAdd = USERS.find(u => u.ID === userId);
    if (!userToAdd) return res.status(404).json({ message: "User not found" });

    if (!org.members.includes(userId)) {
        org.members.push(userId);
    }*/
   
    const organisation = await organisationmodule.findOne({
          _id : organisationId
    })
    if(organisation || organisation.admi.String() !== userId)
        {
            res.json({
                message : "either org doesn't exists or organisation is not created by the admin"
            })
        } 
        if(!memberuser)
    {
        res.json({
            message :  "member does not exist "
        })
    }
    await organisationmodule.updateOne({
        _id : organisationId
    },{
    "$pullAll" : {
    members : memberuser._id
    }
})
});

app.listen(3000, () => {
    console.log("-----------------------------------------");
    console.log("BACKEND API RUNNING ON http://localhost:3000");
    console.log("Endpoints available:");
    console.log("  POST /signup");
    console.log("  POST /signin");
    console.log("  POST /organisation");
    console.log("  GET  /organisation");
    console.log("  POST /boards");
    console.log("  GET  /boards");
    console.log("  POST /issue");
    console.log("  GET  /issue");
    console.log("-----------------------------------------");
});
