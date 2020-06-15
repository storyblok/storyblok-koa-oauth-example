var client = window.axios.create({
  baseURL: 'http://localhost:3000/explore/' + window.SPACE_ID + '/',
  timeout: 10000
})

new Vue({
  el: '#app',
  data() {
    return {
      stories: [],
      story: {},
      showForm: false
    }
  },
  created() {
    this.list()
  },
  methods: {
    handleError(err) {
      alert(err)
    },
    editStory(story) {
      this.story = story
      this.showForm = true
    },
    openNew() {
      this.story = {}
      this.showForm = true
    },
    list() {
      this.showForm = false

      client.get('stories')
        .then((response) => {
          this.stories = response.data.stories
        })
        .catch(this.handleError)
    },
    createOrUpdate() {
      if (this.story.id) {
        this.update(this.story.id)
      } else {
        client.post('stories', {story: this.story})
          .then((response) => {
            console.log(response)
            this.list()
          })
          .catch(this.handleError)
      }
    },
    remove(id) {
      client.delete('stories/' + id)
        .then((response) => {
          console.log(response)
          this.list()
        })
        .catch(this.handleError)
    },
    update(id) {
      client.put('stories/' + id, {story: this.story})
        .then((response) => {
          console.log(response)
          this.list()
        })
        .catch(this.handleError)
    }
  }
})