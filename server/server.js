const express = require('express');
const {Client} = require('@elastic/elasticsearch');
const client = require('./elasticsearch/client');
const cors = require('cors');

const app = express();

const data = require('./data_management/retriever_and_ingest_data');

app.use('/ingest_data', data);

app.use(cors());

app.get('/results', (req, res) => {
    const passedType = req.query.type;
    const passedMag= req.query.mag;
    const passedLocation= req.query.location;
    const passedDateRange= req.query.dateRange;
    const passedSortOption= req.query.sortOption;

    async function sendESRequest(){
        const body = await client.search({
            index: 'earthquakes',
            body: {
                sort: [
                    {
                        mag: {
                            order: passedSortOption,
                        },
                    },
                ],
                size: 300,
                query: {
                    bool: {
                        filter: [
                        {
                            term: { type: passedType },
                        },
                        {
                            range: {
                                mag: {
                                    gte: passedMag,
                                },
                            },
                        },
                        {
                            match: { place: passedLocation },
                        },
                        {
                            range: {
                                '@timestamp': {
                                    gte: `now-${passedDateRange}d/d`,
                                    lt: 'now/d',
                                },
                            },
                        },
                    ],
                    },
                },
            },
        });

        res.json(body.hits.hits);
    }

    sendESRequest();
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => console.group(`Server started on ${PORT}`));