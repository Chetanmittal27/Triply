import multer from "multer";
import fs from "fs";
import path from "path";

const uploadDir = path.join("public", "temp");
// Ensure the destination directory exists on boot -- multer will not
// create it for you and uploads fail with ENOENT otherwise.
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({

  destination: function (req, file, cb) {
    cb(null, uploadDir)
  },

  filename: function (req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_")}`)
  }
})


function fileFilter(req, file, cb){
    // Allow only images and pdfs
    if(file.mimetype === "image/jpeg"  ||  file.mimetype === "image/png"  ||  file.mimetype === "application/pdf"){
        cb(null , true)  // accept file
    }
    else{
        cb(new Error("Only .jpeg , .png and .pdf files are allowed!") , false)
    }
}


export const upload = multer(
    { 
        storage: storage,
        limits: {
            fileSize: 1024 * 1024 * 5   // 5 mb limit
        },
        fileFilter: fileFilter
    }
)