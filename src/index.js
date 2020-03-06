var express = require('express');
var app = express();
var bodyParser = require('body-parser');
const axios = require('axios');

fs = require('fs');

if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));

// parse application/json
app.use(bodyParser.json());

const axiosClockfy = axios.create({
  baseURL: 'https://api.clockify.me/api/v1',
  timeout: 1000,
  headers: { 'X-Api-Key': process.env.CLOCKFY_API_KEY }
});

const CLOCKFY_TAGS = [
  {
    id: '5d7aa845369708190524beff',
    name: 'Backend'
  },
  {
    id: '5d7aa766423b73357fa048dd',
    name: 'Bug'
  },
  {
    id: '5dd3d29c1ca53362a47f27ca',
    name: 'Business Model'
  },
  {
    id: '5d7aa74c423b73357fa048b7',
    name: 'Feature'
  },
  {
    id: '5d7aa83ec3e6b05c6e7f4465',
    name: 'Frontend'
  },
  {
    id: '5d83d3bc5513a166017d8dbc',
    name: 'Illustrations'
  },
  {
    id: '5d7aa81e423b73357fa049b2',
    name: 'Improvement'
  },
  {
    id: '5d7aa76f369708190524be04',
    name: 'Infrastructure'
  },
  {
    id: '5d7aa8cac3e6b05c6e7f44f8',
    name: 'Meeting'
  },
  {
    id: '5d7aa75f423b73357fa048d5',
    name: 'Planning'
  },
  {
    id: '5dc40d8bbe6e746765c395b9',
    name: 'Proposal'
  },
  {
    id: '5d7aa84f369708190524bf10',
    name: 'Prototype'
  },
  {
    id: '5d7aa82b423b73357fa049c5',
    name: 'Rework'
  },
  {
    id: '5d8b530cbb86bb6736e140b3',
    name: 'Task'
  },
  {
    id: '5d7aa756369708190524bdef',
    name: 'UX Review'
  }
];
const CLOCKFY_PROJECTS = [
  {
    id: '5d92176fad3d0067ca65749d',
    boardTrelloId: '59f8c5c7eb36efae803221eb'
  },
  {
    id: '5d7a968fc3e6b05c6e7f2e67',
    boardTrelloId: '5c879fa83b81ac2d34f26972'
  },
  {
    id: '5da07013f6577c51abc1d276',
    boardTrelloId: '5d9f196030e12c17f231c805'
  }
];

app.post('/', async (req, res) => {
  const { action } = req.body;

  if (action.type === 'updateCard') {
    try {
      const { data, date } = action;
      const { data: card } = await axios.get(
        `${process.env.TRELLO_API_BASE}/cards/5e5fb38bb4aa436e73bdf160?all&members=true&key=${process.env.TRELLO_API_KEY}&token=${process.env.TRELLO_TOKEN}`
      );

      if (!card.idMembers.includes(process.env.TRELLO_MY_MEMBER_ID)) return;

      if (data.listAfter.name === 'In Progress') {
        const boardId = card.idBoard;
        const labels = card.labels.map(({ name }) => name);
        const tagIds = CLOCKFY_TAGS.filter(tag =>
          labels.includes(tag.name)
        ).map(tag => tag.id);
        const projectId = CLOCKFY_PROJECTS.find(
          project => project.boardTrelloId === boardId
        ).id;
        const description = card.name;
        const billable = true;

        // add timer
        await axiosClockfy.post(
          `/workspaces/${process.env.CLOCKFY_GEMPE_WORKSPACE}/time-entries`,
          {
            start: date,
            billable,
            description,
            projectId,
            tagIds
          }
        );

        console.log('Timer created successfully!');
        return res.send('Timer created successfully!').status(200);
      }
      if (data.listBefore.name === 'In Progress') {
        // remove timer
        await axiosClockfy.patch(
          `/workspaces/${process.env.CLOCKFY_GEMPE_WORKSPACE}/user/${process.env.CLOCKFY_MY_USER_ID}/time-entries`,
          { end: date }
        );

        console.log('Timer stopped successfully!');
        return res.send('Timer stopped successfully!').status(200);
      }
    } catch (error) {
      console.log('Error. ', error);
      return res.status(500).send(error);
    }
  }
});

app.get('/', (req, res) => {
  return res.status(200).send('HI');
});

app.listen(3000, function() {
  console.log('App listening on port 3000!');
});
