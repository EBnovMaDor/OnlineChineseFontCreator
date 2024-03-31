<template>
  <input type="text" placeholder="username" v-model="username">
  <button @click="handleEnterBtnClick">enter</button>
</template>
<script>

export default {
  name: "Login",
  data (){
    return {
      username:''
    }
  },
  mounted(){
    const username = localStorage.getItem('username');
    if(username){
      this.$router.push('/svg');
      return;
    }
  },
  methods:{
    handleEnterBtnClick () {
      const username = this.username.trim();
      if(username.length < 6) {
        alert('username cannot be less than 6.')
        // username='';
        return;
      }
      localStorage.setItem('username',username);
      // username='';
      this.$router.push('/svg');
    }
  }
}
</script>
<style></style>
