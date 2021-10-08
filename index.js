/**
 * readRequestBody reads in the incoming request body
 * Use await readRequestBody(..) in an async function to get the string
 * @param {Request} request the incoming request to read from
 */
async function readRequestBody(request) {
  const { headers } = request
  const contentType = headers.get('content-type') || ''

  if (contentType.includes('application/json')) {
    return JSON.stringify(await request.json())
  } else if (contentType.includes('application/text')) {
    return request.text()
  } else if (contentType.includes('text/html')) {
    return request.text()
  } else if (contentType.includes('form')) {
    const formData = await request.formData()
    const body = {}
    for (const entry of formData.entries()) {
      body[entry[0]] = entry[1]
    }
    return JSON.stringify(body)
  } else {
    // Perhaps some other type of data was submitted in the form
    // like an image, or some other binary data.
    return 'a file'
  }
}

/**
 * Inserts the application into a google sheet. The sheet is behind nocodeapi.com due to rate limiting and ease of use.
 * @param {Object} body
 * @returns {Bool} if the insertion was successful.
 */
async function insertIntoSheet(body) {
  try {
    const response = await fetch(`${NOCODEAPI_URL}`, {
      method: 'post',
      body: JSON.stringify([JSON.parse(body)]),
      headers: {
        'Content-Type': 'application/json',
      },
    })
    const json = await response.json()
    if (json.message === 'Successfully Inserted') {
      return true
    }
  } catch (error) {
    return false
  }
  return false
}

/**
 * This function sends a discord embed to the provided webhook url
 * @param {Object} body incoming POST body containing the application details
 */
async function sendDiscordEmbed(body) {
  const [
    accName,
    discordName,
    mainGuild,
    apiKey,
    kpLink,
    requirements,
    powerBuilds,
    condiBuilds,
    staticApply,
    staticLogs,
    staticAltars,
    soloLogs,
    soloTimes,
    soloFindMember,
    experience,
    whyJoin,
  ] = JSON.parse(body)

  // Create the Discord Embed
  const fields = [
    {
      name: 'Account',
      value: accName,
      inline: true, // consecutive inline elements go into the same line
    },
    {
      name: 'Discord',
      value: discordName,
      inline: true,
    },
    {
      name: 'Main Guild',
      value: mainGuild,
      inline: true,
    },
    {
      name: '\u200B', // vertical space between fields
      value: '\u200B',
    },
    {
      name: 'API Key',
      value: '[' + apiKey + '](https://gw2efficiency.com/user/api-keys)',
      inline: true,
    },
  ]
  fields.push({
    name: 'Killproof.me',
    value: '[Click me](https://killproof.me/proof/' + accName + ')',
    inline: true,
  })
  fields.push({
    name: '\u200B', // vertical space between fields
    value: '\u200B',
  })
  fields.push({
    name: 'Power Builds',
    value: powerBuilds.replace(/,/g, ', '),
    inline: true,
  })
  fields.push({
    name: 'Condi Builds',
    value: condiBuilds.replace(/,/g, ', '),
    inline: true,
  })

  // distinction between fields depending on trial type (Solo vs Static)
  if (staticApply === 'Solo') {
    fields.push(
      {
        name: 'Logs',
        value: soloLogs,
      },
      {
        name: 'Playtimes',
        value: soloTimes,
      },
      {
        name: 'Who do you play with?',
        value: soloFindMember.replace(/,/g, ', '),
        inline: true,
      },
    )
  } else {
    fields.push(
      {
        name: 'Logs',
        value: staticLogs,
      },
      {
        name: 'Altar Strategy',
        value: staticAltars,
      },
    )
  }

  fields.push(
    {
      name: 'Experience?',
      value: experience,
    },
    {
      name: 'Why do you want to join us?',
      value: whyJoin,
    },
  )

  const payload = {
    // content = message the embed will be attached to (up to 2000 chars)
    content:
      '<@&730372255758155837> <:dTpepedFeelsamazingman:549285673899786251>', // mention Trial Runner role
    embeds: [
      {
        title:
          'New Application! (' + staticApply === 'Solo'
            ? 'Non-Static'
            : 'Static' + ' Trial)',
        thumbnail: {
          // dT Logo (displayed top right of embed)
          url: 'https://cdn.discordapp.com/attachments/765177472836435979/831614589909205042/logo.png',
        },
        fields,
        timestamp: new Date(),
        footer: {
          text: 'I made this :)',
        },
      },
    ],
  }
  try {
    // eslint-disable-next-line no-unused-vars
    await fetch(
      // webhook link (Trial-Alert channel)
      `${DISCORD_WEBHOOK}`,
      {
        method: 'post',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      },
    ) // there is no response to await here, just hope it worked :)
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error:', error)
  }
}

async function handlePostRequest(event) {
  const body = await readRequestBody(event.request)
  let wasSuccessful = await insertIntoSheet(body)

  if (!wasSuccessful) {
    return new Response(
      JSON.stringify(
        { status: 'ERROR', message: 'Inserting the application failed.' },
        null,
        2,
      ),
      {
        headers: {
          'content-type': 'application/json;charset=UTF-8',
        },
      },
    )
  }

  await sendDiscordEmbed(body)

  // When we came this far, nothing went fundamentally wrong. In the worst case the discord embed failed somehow, which is not a reason to tell the client the application failed
  return new Response(JSON.stringify({ status: 'SUCCESS' }, null, 2), {
    headers: {
      'content-type': 'application/json;charset=UTF-8',
    },
  })
}

// this here is the entry point
addEventListener('fetch', (event) => {
  try {
    const request = event.request
    if (request.method.toUpperCase() === 'POST')
      return event.respondWith(handlePostRequest(event))
  } catch (e) {
    return event.respondWith(new Response('Error thrown ' + e.message))
  }
})