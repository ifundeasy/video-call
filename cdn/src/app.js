import path from 'path';
import dotenv from 'dotenv'
import Fastify from 'fastify'
import { fileURLToPath } from 'url';
import fastifyMiddie from '@fastify/middie'
import fastifyStatic from '@fastify/static'
import Live2dModels from '../live2d-models/index.js'

dotenv.config()

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.join(__dirname, '..', 'public');
const remap = (str) => str.split('/').map(el => `${el}babibu`).join('/')
const selectCharacter = (urlPath) => {
  let choosed = Live2dModels.char[urlPath.split('/')[2]]
  if (!choosed) {
    [choosed] = Object.values(Live2dModels.char).filter(char => {
      return remap(urlPath).indexOf(remap(`/${Live2dModels.basePath}/${char.path}`)) > -1 || remap(`/${Live2dModels.basePath}/${char.path}`).indexOf(remap(urlPath)) > -1
    })
  }
  if (!choosed) {
    [choosed] = Object.values(Live2dModels.char).filter(char => char.isDefault && char.isMale)
  }
  return choosed;
}
const fastify = Fastify({
  logger: true
})

await fastify.register(fastifyMiddie)

fastify.register(fastifyStatic, {
  root: publicDir,
  prefix: '/public/',
})

fastify.use('/live2d-models/(.*)', (req, res, next) => {
  // TODO: Authentication check goes here!

  const charUrl = `/${Live2dModels.basePath}/${selectCharacter(req.originalUrl).path}`;
  if (req.originalUrl === charUrl) return next()
  
  res.setHeader('Location', charUrl)
  res.statusCode = 301
  res.end()
  return
})

fastify.register(fastifyStatic, {
  root: path.join(__dirname, '..', 'live2d-models'),
  prefix: '/live2d-models/',
  decorateReply: false, // the reply decorator has been added by the first plugin registration
  allowedPath: (pathName, root, request) => true
})

export default fastify
