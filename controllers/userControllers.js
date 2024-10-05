const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const axios = require('axios');
const { transporter } = require('../utils/email');
const User = require('../models/user');
const Group = require('../models/group');
const Image = require('../models/image');
const { storage } = require('../storage');
const cloudinary = require('cloudinary').v2;
const FormData = require('form-data');

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
})

require('dotenv').config();

module.exports.userRegister = async (req, res) => {

  const name = req.body.name;
  const email = req.body.email;
  const password = req.body.password;

  await User.findOne({email: email}).then( async (user) => {
    if(!user){
      const hashedPassword = await bcrypt.hash(password, 10);

      const newUser = new User(
        {
          email: email,
          password: hashedPassword,
          name: name
        }
      )

      try{
        await newUser.save().then(() => {
          res.status(201).send({
            message: "User Created"
          })
        })
      }catch(err){
        res.status(400).send({
          error: err
        })
      }

    }else{
      res.status(400).send({
        message: `User with email ${email} already exists`
      })
    }
  }) 
};

module.exports.userLogin = async (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  try {
    const user = await User.findOne({ email: email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid Email', code: 'InvalidEmail' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid Password', code: 'InvalidCode' });
    }
    
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '30d' });

    res.json({ token, code: "Success" });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error, code: "Error" });
  }
};

module.exports.userVerifyToken = async (req, res) => {
  const email = req.body.email;
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  try {
    const user = await user.findOne({ email: email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid Email', code: 'InvalidEmail' });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, client) => {
      if (err) return res.Status(403).json({ message: "Unverified", code: "unverified" });
      if(user._id == client.userId){
        res.status(200).send({message: "Verified", code: "verified"})
      }
    });

  } catch (error) {
    res.status(500).json({ message: 'Server error', error, code: "Error" });
  }
};

module.exports.updateUserDetails = async (req, res) => {
  const userId = req.body.id;

  const updatedDetails = {};
  
  if (req.body.name) updatedDetails.name = req.body.name;
  if (req.body.ip_address) updatedDetails.ip_address = req.body.ip_address;
  if (req.body.port) updatedDetails.port = req.body.port;

  try {
    const user = await User.findOneAndUpdate(
      { id: userId },               
      { $set: updatedDetails },      
      { new: true }                  
    );

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.status(200).json({
      message: 'User details updated successfully',
      user: user
    });
    
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

module.exports.createGroup = async (req, res) => {
  const uid = req.body.user_id;
  const gName = req.body.group_name;
  const gDesc = req.body.group_desc;

  const group = new Group({
    name: gName,
    desc: gDesc,
    members: [uid],
    admin: uid
  })

  try{
    await group.save().then( async (createdGroup)=> {

      try {
        const user = await User.findOneAndUpdate(
          { id: uid },
          { $push: { groups: createdGroup.id } },
          { new: true }
        );

        if (!user) {
          return res.status(404).json({ message: 'User not found' });
        }

        return res.status(201).send({
          message: `New group ${gName} has been created`
        })

      } catch (error) {
        return res.status(500).json({ message: error.message });
      }
    })
  }catch{
    res.status(500).json({ message: error.message });
  }
}

module.exports.upload = async (req, res) => { 

  const name = req.body.name;
  const extension = req.body.extension;
  const size = req.body.size;
  const id = req.body.user_id;
  const gid = req.body.group_id;

  var imgPublicId =""

  try {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'sharehub/thumbnails',
        resource_type: 'image',
      },
      async (error, result) => {
        if (error) {
          return res.status(500).send('Error uploading image to Cloudinary');
        }
        imgPublicId = result.public_id
        const optimizedUrl = cloudinary.url(imgPublicId, {
            fetch_format: 'auto',
            quality: 'auto'
        });
        try{
          const image = new Image({
              name: name,
              extension: extension,
              size: size,
              owner: id,
              thumbnailUrl: optimizedUrl,
              publicId: imgPublicId,
              providers: [id],
          });

          try {
            const group = await Group.findOneAndUpdate(
              { id: gid },
              { $push: { images: image } },
              { new: true }
            );

            if (!group) {
              return res.status(404).json({ message: 'Group not found' });
            }

            return res.status(201).send({
              message: `Image ${name}.${extension} uploaded`
            })

          } catch (error) {
            return res.status(500).json({ message: error.message });
          }
        }
        catch(err){
            return res.status(400).send(err.message);
        }
      }
    );

    uploadStream.end(req.file.buffer);
    
  } catch (error) {
    res.status(500).send({message: error});
  }
};

module.exports.getThumbnails = async (req, res) => {

  const gid = req.body.group_id;

  try {
    const group = await Group.findOne({ id: gid });
    if (!group) {
      return res.status(400).json({ message: 'Invalid group' });
    }

    return res.status(200).json({ thumbnails: group.images });

  } catch (error) {
    res.status(500).json({ message: 'Server error', error, code: "Error" });
  }
};

module.exports.getGroups = async (req, res) => {

  const uid = req.body.user_id;

  try {
    const user = await User.findOne({ id: uid });
    if (!user) {
      return res.status(400).json({ message: 'Invalid user' });
    }

    return res.status(200).json({ groups: user.groups });

  } catch (error) {
    res.status(500).json({ message: 'Server error', error, code: "Error" });
  }
};

module.exports.joinGroup = async (req, res) => {

  const uid = req.body.user_id;
  const gid = req.query.gid;        

  try {

    const user = await User.findOne({id: uid})

    if (!user) {
      return res.status(400).json({ message: 'Invalid user' });
    }

    const group = await Group.findOneAndUpdate(
      { id: gid },
      { $push: { members: uid } },
      { new: true }
    );

    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    const changedUser = await User.findOneAndUpdate(
      { id: uid },
      { $push: { groups: gid } },
      { new: true }
    );

    if (!changedUser) {
      return res.status(404).json({ message: 'User not changes' });
    }

    return res.status(201).send({
      message: `You have been joined to the group`
    })

  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports.getImageDetails = async (req, res) => {

  const uid = req.body.user_id;
  const gid = req.body.group_id;
  const imgId = req.body.image_id;   

  try {

    const group = await Group.findOne(
      { id: gid },
    );

    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    const image = group.images.find(img => img.id === imgId);

    if (!image) {
        return res.status(404).send({ message: 'Image not found' });
    }

    return res.status(200).send({
      imageDetails: image 
    })

  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports.getImage = (req, res) => {

  const uid = req.body.user_id;
  const gid = req.body.group_id;
  const imgId = req.body.image_id;   

  try {

    var found = false;

    Group.findOne(
      { id: gid }
    ).then( (group) => {

      if (!group) {
        return res.status(404).json({ message: 'Group not found' });
      }
      
      const image = group.images.find(img => img.id === imgId);

      if (!image) {
          return res.status(404).send({ message: 'Image not found' });
      }

      image.providers.forEach( (providerId) => {
        User.findOne({id: providerId}).then((provider) => {
          if(provider){
            try{
              const providerURL = `http://${provider.ip_address}:${provider.port}/users/sendImage`;

              const data = {
                group_id: gid,
                name: image.name,
                extension: image.extension
              }
              
              axios.post(providerURL, data, {
                responseType: 'arraybuffer'
              }).then( async (response) => {
                
                const responseData = response.data;
                const jsonResponse = response.headers['content-type'].includes('application/json') ? JSON.parse(responseData) : null;

                // Extract the image data (assuming it’s in base64 format)
                const imageBase64 = jsonResponse.image;

                if(jsonResponse == null){
                    return res.status(500).send('No JSON data received');
                }
      
                if(jsonResponse.name == image.name && jsonResponse.extension == image.extension && jsonResponse.size == image.size){
                  
                  found = true;
                  
                  return res.status(200).send({
                    imageData: jsonResponse
                  })
                }
              })

            } catch (error){
              console.log(`Error from ${provider.ip_address}:${provider.port}`);
            }
          }
        })
      })
    })

    if(found){
      return res.status(500).send('No providers found');
    }

  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports.imageReceivedAcknowledgement = async (req, res) => {

  const uid = req.body.user_id;
  const gid = req.body.group_id;
  const imgId = req.body.image_id;   

  try {

    const group = await Group.findOne(
      { id: gid },
    );

    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    const image = group.images.find(img => img.id === imgId);

    if (!image) {
        return res.status(404).send({ message: 'Image not found' });
    }

    if(image.providers.includes(uid)){
      return res.status(200).send('Provider exists');
    } else{
      image.providers.push(uid);

      try{
        await group.save().then( async () => {

          return res.status(200).send('Acknowledged');

        });
      } catch (error) {
        return res.status(500).send('Error saving group');
      }

    }

  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};