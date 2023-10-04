////RECENT CHANGE Oct1 START
//const assignmentModel = require('../Models/assignment-model');//EARLIER
const { Account, Assignment } = require('../Models/association');
////RECENT CHANGE Oct1 END
const {
  validUserId,
  getDecryptedCreds,
  isUUIDv4,
  isValidISODATE,
} = require('../utils/helper');

const createNewAssignment = async (req, res) => {
  // Validation 3: Check data types and value ranges
  if (
    typeof req.body.name !== 'string' ||
    !Number.isInteger(req.body.points) ||
    req.body.points < 1 ||
    req.body.points > 100 ||
    !Number.isInteger(req.body.num_of_attemps) ||
    req.body.num_of_attemps < 1 ||
    req.body.num_of_attemps > 100 ||
    !isValidISODATE(req.body.deadline)
  ) {
    //console.log('Invalid input');
    return res.status(400).json({
      message: 'Bad request-Invalid Assignment Parameters or Empty body',
    });
  }

  //Validation1 for JSON
  if (typeof req.body !== 'object') {
    console.log('Invalid input: Request body is not a JSON object');
    return res.status(400).json({
      message: 'Bad request: Request body must be a JSON object',
    });
  }

  // Validation 2: Check if required fields are missing in the request body
  if (
    !req.body.name ||
    !req.body.points ||
    !req.body.num_of_attemps ||
    !req.body.deadline
  ) {
    console.log('Invalid input');
    return res.status(400).json({
      message: 'Bad request-Required Assignment body Parameters are missing',
    });
  }
  //Validation for Unwanted Fields
  const allowedFields = ['name', 'points', 'num_of_attemps', 'deadline'];
  const requestKeys = Object.keys(req.body);

  // Check if any unwanted fields are present in the request body
  const unwantedFields = requestKeys.filter(
    (key) => !allowedFields.includes(key)
  );

  if (unwantedFields.length > 0) {
    return res.status(400).json({
      message: 'Bad request - Unwanted fields in request body',
      unwantedFields: unwantedFields,
    });
  }
  //Validation for Query String
  const queryParams = Object.keys(req.query);
  if (queryParams.length > 0) {
    return res.status(400).json({
      message: 'Bad request - Query String not Allowed',
    });
  }
  /*if (
    !req.body.name ||
    !req.body.points ||
    !req.body.num_of_attemps ||
    !req.body.deadline ||
    req.body.points < 1 ||
    req.body.points > 10 ||
    !Number.isInteger(req.body.points) ||
    typeof req.body.name !== 'string' ||
    !Number.isInteger(req.body.num_of_attemps) ||
    req.body.num_of_attemps < 1 ||
    req.body.num_of_attemps < 3
  ) {
    console.log('Invalid input');
    return res.status(400).json({
      message: 'Bad request-Invalid Assignment body Parameters',
    });
  }*/
  try {
    //Validation 4 already exists for Specific User
    let { userName } = getDecryptedCreds(req.headers.authorization);
    console.log('Email of User' + ' ' + userName);
    let idValue = await validUserId(userName);
    console.log('User id' + ' ' + idValue);

    let assignmentObj = await Assignment.findOne({
      where: {
        accountId: idValue, // Add this condition to check for the specific user
        name: req.body.name,
        points: req.body.points,
        num_of_attempts: req.body.num_of_attemps,
        deadline: new Date(req.body.deadline), // Convert to Date for comparison
      },
    });

    if (assignmentObj) {
      return res.status(400).json({
        message:
          'Bad request-This Assignment details already exists for Specific User.',
      });
    }
    ////RECENT CHANGE Oct1 START change 1 model NAME and commented
    /*
    let assignmentObj = await Assignment.findOne({
      where: {
        name: req.body.name,
        points: req.body.points,
        num_of_attempts: req.body.num_of_attemps,
        deadline: req.body.deadline,
      },
    });
    if (assignmentObj) {
      //helper.logger.error("Bad request!! The entered sku value already exists. - ", req.body.sku);
      return res.status(400).json({
        message: 'Bad request!! Assignment already exists.',
      });
    }*/
    ////RECENT CHANGE Oct1 END change 1 model NAME and commented

    ////RECENT CHANGE Oct1 START model NAME and Commented
    /*
    let data = await Assignment.create({
      id: idValue,
      name: req.body.name,
      points: req.body.points,
      num_of_attempts: req.body.num_of_attemps,
      deadline: req.body.deadline,
    });*/
    ////RECENT CHANGE Oct1 START model NAME and Commented
    //Change string to Date
    const deadlineDate = new Date(req.body.deadline);
    //NEW CODE ADDED NOW
    let data = await Account.findByPk(idValue);
    console.log('Account Object' + data);
    if (!data) {
      return res.status(404).json({
        message: 'User not found',
      });
    }
    let newAssignment = {
      name: req.body.name,
      points: req.body.points,
      num_of_attempts: req.body.num_of_attemps,
      deadline: deadlineDate,
    };
    console.log('PASSED TILL HERE');
    let assignment = await data.createAssignment(newAssignment);
    //NEW CODE ADDED END
    ////RECENT CHANGE Oct1 START Commented
    /*
    let result = {
      id: data.dataValues.id,
      name: data.dataValues.name,
      points: data.dataValues.points,
      num_of_attempts: data.dataValues.num_of_attempts,
      deadline: data.dataValues.deadline,
    };*/
    ////RECENT CHANGE Oct1 END Commented
    let result = {
      id: assignment.id,
      name: assignment.name,
      points: assignment.points,
      num_of_attempts: assignment.num_of_attempts,
      deadline: assignment.deadline.toISOString(),
      assignment_created: assignment.assignment_created,
      assignment_updated: assignment.assignment_updated,
    };

    return res
      .status(201)
      .json({ message: 'Assignment created successfully', assignment: result });
  } catch (err) {
    return res.status(400).json({ message: 'Bad Request' });
    //console.log('Error in creating new Assignment' + ' ' + err.merssage);
  }
};

const getAssignment = async (req, res) => {
  // helper.logger.info('GET - Product for id - ', req.params.id);
  // helper.statsdClient.increment('GET_product');
  console.log('Get Assignment with ID');
  if (req._body) {
    // helper.logger.error('Bad request. Request body present.');
    return res.status(400).send('Bad Request-Request body present');
  }

  let id = req.params.id;
  const idCheck = isUUIDv4(id);
  if (!idCheck) {
    return res.status(400).json({
      message: 'Bad request- Assignment Id is Incorrect',
    });
  }

  //Validation for Query String
  const queryParams = Object.keys(req.query);
  if (queryParams.length > 0) {
    return res.status(400).json({
      message: 'Bad request - Query String not Allowed',
    });
  }

  try {
    console.log('Checks passed');
    const existingAssignment = await Assignment.findByPk(id);
    if (!existingAssignment) {
      return res.status(400).json({
        message: 'Bad Request-Assignment not found',
      });
    } else if (existingAssignment) {
      let { userName } = getDecryptedCreds(req.headers.authorization);
      //console.log('Email of User' + ' ' + userName);
      let idValue = await validUserId(userName);
      let ownerCheck = existingAssignment.accountId;
      if (ownerCheck !== idValue) {
        return res.status(403).json({
          message: 'Forbidden-Assignment belongs to another User',
        });
      }
    }
    let result = {
      id: existingAssignment.dataValues.id,
      name: existingAssignment.dataValues.name,
      points: existingAssignment.dataValues.points,
      num_of_attempts: existingAssignment.dataValues.num_of_attempts,
      deadline: existingAssignment.dataValues.deadline,
    };
    //helper.logger.info('Product Successfully fetched');
    console.log('Assignment fetched successfully');
    return res
      .status(200)
      .json({ message: 'Assignment fetched successfully', assignment: result });
  } catch (err) {
    // helper.logger.error('DB Error - ', err);
    // res.status(400).send('Bad Request');
    return res.status(400).json({ message: 'Bad request ' });
    //console.log('Error in accessing the Assignment' + ' ' + err.message);
  }
};

const getAllAssignments = async (req, res) => {
  // helper.logger.info('GET - Product for id - ', req.params.id);
  // helper.statsdClient.increment('GET_product');
  console.log('Get all Assignment ');
  if (req._body) {
    // helper.logger.error('Bad request. Request body present.');
    return res.status(400).send('Bad Request-Request body present');
  }

  //Validation for Query String
  const queryParams = Object.keys(req.query);
  if (queryParams.length > 0) {
    return res.status(400).json({
      message: 'Bad request - Query String not Allowed',
    });
  }
  //let id = req.params.id;

  try {
    // helper.logger.info('Checks Passed.');
    let { userName } = getDecryptedCreds(req.headers.authorization);
    //console.log('Email of User' + ' ' + userName);
    let idValue = await validUserId(userName);
    //RECENT CANGE START COMMENTED
    //let idValue = await validUserId(userName);
    //RECENT CHNAGE END COMMENTED
    //const account = await Account.findOne({ where: { email: userName } });
    //console.log('User Id' + idValue);
    let data = await Assignment.findAll({
      where: {
        accountId: idValue,
      },
    });
    //console.log('length' + data.length);
    if (!data || data.length === 0) {
      return res.status(404).json({
        message: 'Assignments Not Found',
      });
    }
    let results = data.map((item) => ({
      id: item.dataValues.id,
      name: item.dataValues.name,
      points: item.dataValues.points,
      num_of_attempts: item.dataValues.num_of_attempts,
      deadline: item.dataValues.deadline,
      assignment_created: item.dataValues.assignment_created,
      assignment_updated: item.dataValues.assignment_updated,
    }));
    //helper.logger.info('Product Successfully fetched');
    console.log('Assignments fetched successfully');
    return res.status(200).json({
      message: 'Assignments fetched successfully',
      assignments: results,
    });
  } catch (err) {
    // helper.logger.error('DB Error - ', err);
    // res.status(400).send('Bad Request');
    res.status(400).send('Bad Request');
  }
};

const putAssignmentInfo = async (req, res) => {
  //Validation for Assignments
  // Validation 3: Check data types and value ranges
  if (
    typeof req.body.name !== 'string' ||
    !Number.isInteger(req.body.points) ||
    req.body.points < 1 ||
    req.body.points > 100 ||
    !Number.isInteger(req.body.num_of_attemps) ||
    req.body.num_of_attemps < 1 ||
    req.body.num_of_attemps > 100 ||
    typeof req.body.deadline !== 'string'
  ) {
    console.log('Invalid input');
    return res.status(400).json({
      message: 'Bad request-Invalid Assignment body Parameters',
    });
  }

  //Validation1 for JSON
  if (typeof req.body !== 'object') {
    console.log('Invalid input: Request body is not a JSON object');
    return res.status(400).json({
      message: 'Bad request: Request body must be a JSON object',
    });
  }

  // Validation 2: Check if required fields are missing in the request body
  if (
    !req.body.name ||
    !req.body.points ||
    !req.body.num_of_attemps ||
    !req.body.deadline
  ) {
    console.log('Invalid input');
    return res.status(400).json({
      message: 'Bad request-Required Assignment body Parameters are missing',
    });
  }
  //Validation for Unwanted Fields
  const allowedFields = ['name', 'points', 'num_of_attemps', 'deadline'];
  const requestKeys = Object.keys(req.body);

  // Check if any unwanted fields are present in the request body
  const unwantedFields = requestKeys.filter(
    (key) => !allowedFields.includes(key)
  );

  if (unwantedFields.length > 0) {
    return res.status(400).json({
      message: 'Bad request - Unwanted fields in request body',
      unwantedFields: unwantedFields,
    });
  }
  /*
  // Check if the request body is empty
  if (Object.keys(req.body).length === 0) {
    return res.status(400).json({
      message: 'Bad request - Request body is empty',
    });
  }*/

  let id = req.params.id;
  const idCheck = isUUIDv4(id);
  if (!idCheck) {
    return res.status(400).json({
      message: 'Bad request- Assignment Id is Incorrect',
    });
  }
  try {
    /*let prodObj = await db.product.findOne({where:{sku:req.body.sku}});
      if(prodObj && prodObj.dataValues.id != id) {
          helper.logger.error("Bad request!! The entered sku value already exists. - ", req.body.sku);
          return res.status(400).json({
              message: "Bad request!! The entered sku value already exists."
          });
      }*/

    // Check if the Assignment with the given ID exists
    const existingAssignment = await Assignment.findByPk(id);
    if (!existingAssignment) {
      return res.status(400).json({
        message: 'Bad Request-Assignment not found',
      });
    } else if (existingAssignment) {
      let { userName } = getDecryptedCreds(req.headers.authorization);
      //console.log('Email of User' + ' ' + userName);
      let idValue = await validUserId(userName);
      let ownerCheck = existingAssignment.accountId;
      if (ownerCheck !== idValue) {
        return res.status(403).json({
          message: 'Forbidden-Assignment belongs to another User',
        });
      }
    }
    console.log('Checks Passed');
    const deadlineDate = new Date(req.body.deadline);
    // Perform the update
    await Assignment.update(
      {
        name: req.body.name,
        points: req.body.points,
        num_of_attempts: req.body.num_of_attemps,
        deadline: deadlineDate,
      },
      {
        where: {
          id: id,
        },
      }
    );

    const data = await Assignment.findByPk(id);
    let result = {
      id: data.dataValues.id,
      name: data.dataValues.name,
      points: data.dataValues.points,
      num_of_attempts: data.dataValues.num_of_attempts,
      deadline: data.dataValues.deadline,
      deadline: data.deadline.toISOString(),
      assignment_created: data.assignment_created,
      assignment_updated: data.assignment_updated,
    };
    console.log('Assignment Successfully Updated');
    return res
      .status(200)
      .json({ message: 'Assignment successfully updated', assignment: result });
  } catch (err) {
    //helper.logger.error("DB Error - ", err);
    res.status(400).send('Bad Request');
  }
};

const deleteAssignmentInfo = async (req, res) => {
  //Validation for delete Assignments

  // Check if the request body is empty
  if (Object.keys(req.body).length > 0) {
    return res.status(400).json({
      message: 'Bad request - Request body not required',
    });
  }

  let id = req.params.id;
  const idCheck = isUUIDv4(id);
  if (!idCheck) {
    return res.status(400).json({
      message: 'Bad request- Assignment Id is Incorrect',
    });
  }
  try {
    // Check if the Assignment with the given ID(UUID4 version) exists
    const existingAssignment = await Assignment.findByPk(id);
    if (!existingAssignment) {
      return res.status(404).json({
        message: 'Bad Request-Assignment not found',
      });
    } else if (existingAssignment) {
      let { userName } = getDecryptedCreds(req.headers.authorization);
      //console.log('Email of User' + ' ' + userName);
      let idValue = await validUserId(userName);
      let ownerCheck = existingAssignment.accountId;
      if (ownerCheck !== idValue) {
        return res.status(403).json({
          message: 'Forbidden-Assignment belongs to another User',
        });
      }
    }
    console.log('Checks Passed');
    // Capture the assignment data before deleting
    const deletedAssignment = { ...existingAssignment.toJSON() };
    // Perform the delete
    await existingAssignment.destroy();
    //console.log('Assignment Successfully deleted');
    return res.status(200).json({
      message: 'Assignment successfully deleted',
      assignment: deletedAssignment,
    });
  } catch (err) {
    //helper.logger.error("DB Error - ", err);
    res.status(400).send('Bad Request');
  }
};

module.exports = {
  createNewAssignment,
  getAssignment,
  getAllAssignments,
  putAssignmentInfo,
  deleteAssignmentInfo,
};