var express = require('express');
var app = express();
var path = require('path');
var formidable = require('formidable');
var querystring =require('querystring');
var fs = require('fs');

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', function(req, res){
  res.sendFile(path.join(__dirname, 'views/index.html'));
});

//上传文件保存在本地磁盘（优点：简单易用，缺点：无法对上传文件进行操作）
app.post('/upload', function(req, res){
  console.log("upload...");
  // create an incoming form object
  var form = new formidable.IncomingForm();

  // specify that we want to allow the user to upload multiple files in a single request
  form.multiples = true;

  // store all uploads in the /uploads directory
  form.uploadDir = path.join(__dirname, '/uploads');

  // every time a file has been uploaded successfully,
  // rename it to it's orignal name
  form.on('file', function(field, file) {
    fs.rename(file.path, path.join(form.uploadDir, file.name));
  });

  // log any errors that occur
  form.on('error', function(err) {
    console.log('An error has occured: \n' + err);
  });

  // once all the files have been uploaded, send a response to the client
  form.on('end', function() {
    res.end('success');
  });

  // parse the incoming request containing the form data
  form.parse(req);

});



//上传文件，转换为字节流（如果需要对文件进行操作应使用此接口）
app.post('/upload-imageData', (req, res, next) => {
  console.log("upload-imageData...");  
  req.setEncoding('binary');
  var body = '';   // 文件数据
  var fileName = '';  // 文件名
  // 边界字符串
  var boundary = req.headers['content-type'].split('; ')[1].replace('boundary=','');
  req.on('data', function(chunk){
    body += chunk;
  });

  req.on('end', function() {
    var file = querystring.parse(body, '\r\n', ':');
    // 只处理图片文件
    if (file['Content-Type'].indexOf("image") !== -1)
    {
      //获取文件名
      var fileInfo = file['Content-Disposition'].split('; ');
      for (value in fileInfo){
        if (fileInfo[value].indexOf("filename=") != -1){
          fileName = fileInfo[value].substring(10, fileInfo[value].length-1);

          if (fileName.indexOf('\\') != -1){
            fileName = fileName.substring(fileName.lastIndexOf('\\')+1);
          }
          console.log("文件名: " + fileName);
        }
      }
      // 获取图片类型(如：image/gif 或 image/png))
      var entireData = body.toString();
      var contentTypeRegex = /Content-Type: image\/.*/;

      contentType = file['Content-Type'].substring(1);

      //获取文件二进制数据开始位置，即contentType的结尾
      var upperBoundary = entireData.indexOf(contentType) + contentType.length;
      var shorterData = entireData.substring(upperBoundary);

      // 替换开始位置的空格
      var binaryDataAlmost = shorterData.replace(/^\s\s*/, '').replace(/\s\s*$/, '');

      // 去除数据末尾的额外数据，即: "--"+ boundary + "--"(到这里，剩下的才是图片的二进制数据)     
      var binaryData = binaryDataAlmost.substring(0, binaryDataAlmost.indexOf('--'+boundary+'--'));
      /*------------          这一段根据实际需求进行操作            --------------
      //将二进制数据转换为字节数组
      //var bufD=new Buffer(binaryData,"binary");
      //将字节数组装换为base64
      // var base64Str = bufD.toString('base64');
      //将base64转换为url
      // var datauri = 'data:image/png;base64,' + base64Str;
      ------------                      --------------*/
      // 保存文件
       fs.writeFile(path.join(__dirname, '/uploads/')+fileName, binaryData, 'binary', function(err) {
        res.end('图片上传完成');
       });
    } else {
      res.end('只能上传图片文件');
    }
  }); 
})



/*html5中可以以a标签的形式轻松实现文件下载，但是这种做法的不足在于，对于.html/.txt/ .jpg等文件，
有些浏览器会直接打开，所以考虑浏览器差异，需要谋求更通用的一种方式。*/
var fileName="/download.jpg"
app.get("/download1",function(req,res){
  console.log("download1...");
  fs.readFile(path.join(__dirname, '/download/')+fileName, function(isErr, data){  
    if (isErr) {  
      console.dir(isErr);
           res.end("Read file failed!");  
           return;  
     }  
     res.writeHead(200,{        
           'Content-Type': 'application/octet-stream', //告诉浏览器这是一个二进制文件  
           'Content-Disposition': 'attachment; filename=' + fileName, //告诉浏览器这是一个需要下载的文件  
     });  
     res.end(data)  
})
})


app.get("/download2", function (req, res) {
  console.log("download2...");
  res.writeHead(200, {
    'Content-Type': 'application/octet-stream', //告诉浏览器这是一个二进制文件  
    'Content-Disposition': 'attachment; filename=' + fileName, //告诉浏览器这是一个需要下载的文件  
  });
  fs.createReadStream(path.join(__dirname, '/download/')+fileName).pipe(res);
})













var server = app.listen(80, function(){
  console.log('Server listening on port 80');
});
