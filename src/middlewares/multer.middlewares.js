import multer from "multer";


const storage = multer.diskStorage({

  destination: function (req, file, cb) {
    cb(null, '/public/temp')
  },

  filename: function (req, file, cb) {
    cb(null, file.originalname)
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