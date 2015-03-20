package com.libqa.web.controller;

import com.libqa.web.domain.User;
import com.libqa.web.repository.UserRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.ModelAndView;

import java.util.List;

/**
 * Created by yion on 2015. 1. 25..
 */
@RestController
@RequestMapping("/")
@Slf4j
public class SampleController {

    @Autowired
    private UserRepository userRepository;

    @RequestMapping("index")
    public String index() {
        System.out.println("#### index comming !!!!");
        return "Greeting from Sping Boot";
    }

    @RequestMapping("users")
    @ResponseBody
    public List<User> getUsers() {
        return userRepository.findAll();
    }

    @RequestMapping("/sample/layout")
    public ModelAndView layout(Model model) {
        ModelAndView mav = new ModelAndView("sample/layout");
        return mav;
    }

    @RequestMapping("/sample/home")
    public ModelAndView home(Model model) {
        ModelAndView mav = new ModelAndView("sample/home");
        return mav;
    }
}

